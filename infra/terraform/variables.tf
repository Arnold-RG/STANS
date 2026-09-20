variable "project_name" {
  type    = string
  default = "stans"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "instance_type" {
  type    = string
  default = "t3.small"
}

variable "key_name" {
  type        = string
  description = "Existing EC2 key pair name used for SSH."
}

variable "ssh_cidr" {
  type        = string
  description = "CIDR allowed to reach SSH. Prefer your public IP /32."
  default     = "0.0.0.0/0"
}

variable "container_image" {
  type    = string
  default = "ghcr.io/arnold-rg/stans:latest"
}

variable "domain" {
  type        = string
  description = "Public DNS name pointed at the instance. Leave empty to skip Certbot."
  default     = ""
}

variable "letsencrypt_email" {
  type    = string
  default = ""
}
