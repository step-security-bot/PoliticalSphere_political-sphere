variable "distribution_name" {
  description = "Name of the CloudFront distribution"
  type        = string
}

variable "comment" {
  description = "Comment to describe the CloudFront distribution"
  type        = string
  default     = ""
}

variable "default_root_object" {
  description = "Object that CloudFront returns when a user requests the root URL"
  type        = string
  default     = "index.html"
}

variable "price_class" {
  description = "Price class for CloudFront distribution"
  type        = string
  default     = "PriceClass_100"
}

variable "origins" {
  description = "List of origins for the CloudFront distribution"
  type = list(object({
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
  default = []
}

variable "default_cache_behavior" {
  description = "Default cache behavior for the CloudFront distribution"
  type = object({
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
}

variable "ordered_cache_behaviors" {
  description = "Ordered cache behaviors for the CloudFront distribution"
  type = list(object({
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
  }))
  default = []
}

variable "custom_error_responses" {
  description = "Custom error responses for the CloudFront distribution"
  type = list(object({
    error_code            = number
    response_code         = optional(number)
    response_page_path    = optional(string)
    error_caching_min_ttl = optional(number, 300)
  }))
  default = []
}

variable "geo_restriction" {
  description = "Geo restriction configuration"
  type = object({
    restriction_type = string
    locations        = optional(list(string), [])
  })
  default = {
    restriction_type = "none"
  }
}

variable "viewer_certificate" {
  description = "Viewer certificate configuration"
  type = object({
    acm_certificate_arn      = string
    minimum_protocol_version = optional(string, "TLSv1.2_2021")
  })
}

variable "web_acl_id" {
  description = "WAF Web ACL ID to associate with the distribution"
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}