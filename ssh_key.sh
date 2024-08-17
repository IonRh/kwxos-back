#!/bin/bash

# 确保脚本以 root 用户身份运行
if [ "$(id -u)" -ne 0 ]; then
    echo "请以 root 用户运行此脚本。"
    exit 1
fi

# 读取用户输入的公钥
read -p "请输入 root 用户的公钥内容: " ssh_key

# 备份当前的 sshd_config 文件
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

# 修改 sshd_config 文件
sed -i 's/^#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^PermitRootLogin .*$/PermitRootLogin without-password/' /etc/ssh/sshd_config

# 确保 root 用户的 .ssh 目录和 authorized_keys 文件存在
mkdir -p /root/.ssh
chmod 700 /root/.ssh
touch /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys

# 将用户的公钥添加到 authorized_keys 文件中
echo "$ssh_key" >> /root/.ssh/authorized_keys

# 重启 SSH 服务
systemctl restart sshd

echo "root 用户的 SSH 登录方式已成功更改为密钥登录。"
