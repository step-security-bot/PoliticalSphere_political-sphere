terraform {
  required_version = ">= 1.6.0"

  backend "s3" {
    bucket         = "political-sphere-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "political-sphere-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.region
}

locals {
  base_tags = merge({
    Environment = var.environment
    Project     = "political-sphere"
  }, var.extra_tags)

  vpc = {
    name              = "${var.environment}-core"
    cidr_block        = var.vpc_cidr_block
    azs               = var.availability_zones
    public_subnets    = var.public_subnet_cidrs
    private_subnets   = var.private_subnet_cidrs
    enable_nat_gateway = var.enable_nat_gateway
  }

  eks = {
    cluster_name    = "${var.environment}-eks"
    cluster_version = "1.29"
    node_groups = {
      general = {
        instance_types = ["m6g.large"]
        desired_size   = 3
        min_size       = 3
        max_size       = 10
        disk_size      = 100
      }
      game = {
        instance_types = ["c6g.xlarge"]
        desired_size   = 2
        min_size       = 2
        max_size       = 8
        disk_size      = 50
        labels = {
          workload = "game-server"
        }
      }
    }
    log_types  = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
    enable_irsa = true
  }

  rds = {
    identifier              = "${var.environment}-postgres"
    username                = var.rds_username
    password                = var.rds_password
    database_name           = "politicalsphere"
    multi_az                = true
    allocated_storage       = 100
    max_allocated_storage   = 1000
    instance_class          = "db.r6g.large"
    backup_retention_period = 30
    preferred_backup_window = "03:00-05:00"
    preferred_maintenance_window = "sat:06:00-sat:07:00"
    deletion_protection     = true
    storage_encrypted       = true
    kms_key_id              = ""
    enabled_cloudwatch_logs_exports = ["postgresql"]
  }

  redis = {
    replication_group_id  = "${var.environment}-redis"
    engine_version        = "7.1"
    node_type             = "cache.r6g.large"
    number_cache_clusters = 3
    multi_az_enabled      = true
    auth_token            = var.redis_auth_token
  }

  s3_buckets = {
    "political-sphere-${var.environment}-artifacts" = {
      versioning_enabled = true
      lifecycle_rules = [{
        id      = "retain-artifacts"
        enabled = true
        transition = [{
          days          = 30
          storage_class = "STANDARD_IA"
        }]
        expiration = {
          days = 365
        }
      }]
      public_access_block = {
        block_public_acls       = true
        ignore_public_acls      = true
        block_public_policy     = true
        restrict_public_buckets = true
      }
      tags = {
        DataClassification = "internal"
      }
    }
    "political-sphere-${var.environment}-logs" = {
      versioning_enabled = true
      force_destroy      = false
      tags = {
        DataClassification = "logs"
      }
    }
    "political-sphere-${var.environment}-assets" = {
      versioning_enabled = true
      public_access_block = {
        block_public_acls       = true
        ignore_public_acls      = true
        block_public_policy     = true
        restrict_public_buckets = true
      }
      tags = {
        DataClassification = "public"
      }
    }
  }

  ecr_repositories = {
    "political-sphere/${var.environment}/api" = {
      image_tag_mutability = "IMMUTABLE"
      lifecycle_policy = {
        tag_status = "any"
        count      = 100
      }
    }
    "political-sphere/${var.environment}/web" = {
      image_tag_mutability = "IMMUTABLE"
      lifecycle_policy = {
        tag_status = "any"
        count      = 100
      }
    }
    "political-sphere/${var.environment}/game-server" = {
      image_tag_mutability = "IMMUTABLE"
      lifecycle_policy = {
        tag_status = "any"
        count      = 100
      }
    }
  }

  route53_zone = {
    zone_name = var.route53_zone_name
    comment   = "Managed by Terraform"
    records   = {}
  }

  acm = {
    domain_name               = var.primary_domain
    subject_alternative_names = var.additional_domains
    validation_method         = "DNS"
    zone_id                   = ""
  }

  cloudfront = {
    distribution_name = "${var.environment}-cdn"
    comment           = "Political Sphere ${var.environment} CDN"
    default_root_object = "index.html"
    price_class       = "PriceClass_All"
    origins = [
      {
        domain_name = "${var.environment}-web.${var.primary_domain}"
        origin_id   = "web-origin"
        custom_origin_config = {
          http_port              = 80
          https_port             = 443
          origin_protocol_policy = "https-only"
          origin_ssl_protocols   = ["TLSv1.2"]
        }
      }
    ]
    default_cache_behavior = {
      allowed_methods  = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
      cached_methods   = ["GET", "HEAD"]
      target_origin_id = "web-origin"
      forward_query_string = true
      forward_cookies      = "all"
      viewer_protocol_policy = "redirect-to-https"
      min_ttl                = 0
      default_ttl            = 86400
      max_ttl                = 31536000
      compress               = true
    }
    custom_error_responses = [
      {
        error_code = 404
        response_code = 200
        response_page_path = "/index.html"
        error_caching_min_ttl = 300
      }
    ]
    geo_restriction = {
      restriction_type = "none"
    }
    viewer_certificate = {
      acm_certificate_arn = ""  # Will be set after ACM module is created
    }
  }

  kms = {
    description             = "Political Sphere ${var.environment} key"
    enable_key_rotation     = true
    deletion_window_in_days = 30
    aliases                 = ["alias/political-sphere-${var.environment}"]
    key_administrators      = var.kms_administrators
    key_users               = var.kms_users
  }

  iam = {
    github_org               = var.github_org
    repositories             = var.github_repositories
    role_name_prefix         = "politicalsphere-${var.environment}"
    permissions_boundary_arn = var.github_permissions_boundary
    policy_statements        = local.github_policy_statements
  }

  github_policy_statements = [
    {
      sid       = "AllowECR"
      actions   = [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:DescribeRepositories",
        "ecr:GetRepositoryPolicy"
      ]
      resources = ["*"]
    },
    {
      sid       = "AllowLogs"
      actions   = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      resources = ["*"]
    },
    {
      sid       = "AllowS3Artifacts"
      actions   = [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ]
      resources = [
        "arn:aws:s3:::political-sphere-${var.environment}-artifacts",
        "arn:aws:s3:::political-sphere-${var.environment}-artifacts/*"
      ]
    }
  ]
}

module "environment" {
  source = "../.."

  region      = var.region
  environment = var.environment
  tags        = local.base_tags

  vpc             = local.vpc
  eks             = local.eks
  rds             = local.rds
  redis           = local.redis
  ecr_repositories = local.ecr_repositories
  route53_zone    = local.route53_zone
  acm             = local.acm
  s3_buckets      = local.s3_buckets
  kms             = local.kms
  iam             = local.iam
}
