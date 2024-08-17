#!/bin/bash
# 确保脚本以 root 用户身份运行
if [ "$(id -u)" -ne 0 ]; then
    echo "请以 root 用户运行此脚本。"
    exit 1
fi

# 读取用户输入的公钥，并进行基本格式验证
read -p "请输入 root 用户的公钥内容: " ssh_key
if [[ ! $ssh_key =~ ^ssh-rsa.*|^ssh-dss.*|^ecdsa-sha2-nistp.*|^ssh-ed25519.* ]]; then
    echo "公钥格式不正确。"
    exit 1
fi

# 备份当前的 sshd_config 文件
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak || { echo "备份失败"; exit 1; }

# 安全地修改 sshd_config 文件
sed -i '/^#PubkeyAuthentication yes/c\PubkeyAuthentication yes' /etc/ssh/sshd_config || { echo "修改 PubkeyAuthentication 失败"; exit 1; }
sed -i '/^PasswordAuthentication yes/c\PasswordAuthentication no' /etc/ssh/sshd_config || { echo "修改 Password失败"; exit 1; }
sed -i '/^PermitRootLogin .*$/c\PermitRootLogin without-password' /etc/ssh/sshd_config || { echo "修改 PermitRootLogin 失败"; exit 1; }

# 确保 root 用户的 .ssh 目录和 authorized_keys 文件存在
mkdir -p /root/.ssh
ch700 /root/.ssh
touch /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys

# 将用户的公钥添加到 authorized_keys 文件中
echo "$ssh_key" >> /root/.ssh/authorized_keys

# 重启 SSH 服务
systemctl restart sshd || { echo "重启 SSH 服务失败"; exit 1; }

echo "root 用户的 SSH 登录方式已成功更改为密钥登录。"
