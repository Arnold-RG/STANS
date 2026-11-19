output "public_ip" {
  value = aws_instance.stans.public_ip
}

output "public_dns" {
  value = aws_instance.stans.public_dns
}

output "ssh_command" {
  value = "ssh -i <your-key.pem> ubuntu@${aws_instance.stans.public_ip}"
}
