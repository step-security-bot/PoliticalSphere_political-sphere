variable "region" {
  description = "AWS region to deploy infrastructure into."
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment identifier (dev, staging, prod)."
  type        = string
}

variable "tags" {
  description = "Common tags applied to all resources."
  type        = map(string)
  default = {
    Project     = "political-sphere"
    Terraform   = "true"
    ManagedBy   = "terraform"
  }
}

variable "vpc" {
  description = "Configuration for the VPC module."
  type = object({
    name              = string
    cidr_block        = string
    azs               = list(string)
    public_subnets    = list(string)
    private_subnets   = list(string)
    enable_nat_gateway = optional(bool, true)
  })
}

variable "eks" {
  description = "Configuration for the EKS module."
  type = object({
    cluster_name    = string
    cluster_version = optional(string, "1.29")
    node_groups     = optional(map(object({
      instance_types = list(string)
      desired_size   = number
      min_size       = number
      max_size       = number
      disk_size      = optional(number)
      capacity_type  = optional(string)
      labels         = optional(map(string))
      taints         = optional(list(object({
        key    = string
        value  = string
        effect = string
      })))
    })), null)
    log_types   = optional(list(string))
    enable_irsa = optional(bool)
  })
}

variable "rds" {
  description = "Configuration for the RDS module."
  type = object({
    identifier              = string
    engine_version          = optional(string, "15.4")
    instance_class          = optional(string, "db.m6g.large")
    allocated_storage       = optional(number, 100)
    max_allocated_storage   = optional(number, 1000)
    username                = string
    password                = string
    database_name           = optional(string, "politicalsphere")
    multi_az                = optional(bool, false)
    backup_retention_period = optional(number, 7)
    preferred_backup_window = optional(string, "04:00-06:00")
    preferred_maintenance_window = optional(string, "sun:06:00-sun:07:00")
    deletion_protection     = optional(bool, true)
    storage_encrypted       = optional(bool, true)
    kms_key_id              = optional(string, "")
  })
  sensitive = true
}

variable "redis" {
  description = "Configuration for Redis module."
  type = object({
    replication_group_id  = string
    engine_version        = optional(string, "7.1")
    node_type             = optional(string, "cache.t4g.small")
    number_cache_clusters = optional(number, 2)
    multi_az_enabled      = optional(bool, true)
    auth_token            = optional(string, "")
  })
  default   = null
  sensitive = true
}

variable "ecr_repositories" {
  description = "Map of ECR repositories to provision."
  type        = map(any)
}

variable "ecr_replication_rules" {
  description = "Optional ECR replication rules."
  type        = list(any)
  default     = []
}

variable "route53_zone" {
  description = "Route53 hosted zone configuration."
  type = object({
    zone_name  = string
    comment    = optional(string, "Managed by Terraform")
    records    = optional(map(any), {})
    vpc_id     = optional(string, "")
    vpc_region = optional(string, "")
  })
}

variable "acm" {
  description = "ACM certificate configuration."
  type = object({
    domain_name               = string
    subject_alternative_names = optional(list(string), [])
    validation_method         = optional(string, "DNS")
    zone_id                   = optional(string, "")
  })
}

variable "s3_buckets" {
  description = "Map of S3 bucket configuration."
  type        = map(any)
  default     = {}
}

variable "kms" {
  description = "KMS configuration."
  type = object({
    description             = optional(string, "Political Sphere shared key")
    enable_key_rotation     = optional(bool, true)
    deletion_window_in_days = optional(number, 30)
    aliases                 = optional(list(string), [])
    key_administrators      = optional(list(string), [])
    key_users               = optional(list(string), [])
  })
}

variable "iam" {
  description = "IAM GitHub OIDC configuration."
  type = object({
    github_org               = string
    repositories             = list(string)
    role_name_prefix         = optional(string, "politicalsphere")
    permissions_boundary_arn = optional(string, "")
    policy_statements        = optional(list(object({
      sid       = optional(string)
      actions   = list(string)
      resources = list(string)
      effect    = optional(string, "Allow")
    })), [])
  })
}

variable "cloudfront" {
  description = "CloudFront CDN configuration."
  type = object({
    distribution_name      = optional(string)
    comment                = optional(string)
    default_root_object    = optional(string, "index.html")
    price_class            = optional(string, "PriceClass_100")
    origins                = list(object({
      domain_name = string
      origin_id   = string
      s3_origin_config = optional(object({
        origin_access_identity = optional(string)
      }))
      custom_origin_config = optional(object({
        http_port                = optional(number, 80)
        https_port               = optional(number, 443)
        origin_protocol_policy   = optional(string, "https-only")
        origin_ssl_protocols     = optional(list(string), ["TLSv1.2"])
        origin_keepalive_timeout = optional(number, 5)
        origin_read_timeout      = optional(number, 30)
      }))
    }))
    default_cache_behavior = object({
      allowed_methods  = list(string)
      cached_methods   = list(string)
      target_origin_id = string
      forward_query_string = optional(bool, false)
      forward_cookies      = optional(string, "none")
      viewer_protocol_policy = optional(string, "redirect-to-https")
      min_ttl                = optional(number, 0)
      default_ttl            = optional(number, 86400)
      max_ttl                = optional(number, 31536000)
      compress               = optional(bool, true)
      lambda_function_associations = optional(list(object({
        event_type   = string
        lambda_arn   = string
        include_body = optional(bool, false)
      })), [])
    })
    ordered_cache_behaviors = optional(list(object({
      path_pattern     = string
      allowed_methods  = list(string)
      cached_methods   = list(string)
      target_origin_id = string
      forward_query_string = optional(bool, false)
      forward_cookies      = optional(string, "none")
      viewer_protocol_policy = optional(string, "redirect-to-https")
      min_ttl                = optional(number, 0)
      default_ttl            = optional(number, 86400)
      max_ttl                = optional(number, 31536000)
      compress               = optional(bool, true)
    })), [])
    custom_error_responses = optional(list(object({
      error_code            = number
      response_code         = optional(number)
      response_page_path    = optional(string)
      error_caching_min_ttl = optional(number, 300)
    })), [])
    geo_restriction = optional(object({
      restriction_type = string
      locations        = optional(list(string), [])
    }), { restriction_type = "none" })
    viewer_certificate = object({
      acm_certificate_arn      = string
      minimum_protocol_version = optional(string, "TLSv1.2_2021")
    })
    web_acl_id = optional(string)
  })
  default = null
}
