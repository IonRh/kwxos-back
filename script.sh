#!/bin/sh

UUID="$(cat /proc/sys/kernel/random/uuid)"

# Xray latest release version
RELEASE_LATEST=''

# Two very important variables
TMP_DIRECTORY="$(mktemp -d)"
ZIP_FILE="${TMP_DIRECTORY}/web.zip"

generate_nzxray() {
  cat > nzxray.sh << EOF
#!/bin/sh
#!/usr/bin/env bash
./xray -c config.json 2>&1 &
# 哪吒的三个参数
NEZHA_SERVER=nezha-kwxos.fly.dev
NEZHA_PORT=5555
NEZHA_KEY=9WS10Zf7Le7KKpiLeI
# 检测是否已运行
check_run() {
  [[ \$(pgrep -laf nezha-agent) ]] && echo "哪吒客户端正在运行中!" && exit
}
# 三个变量不全则不安装哪吒客户端
check_variable() {
  [[ -z "\${NEZHA_SERVER}" || -z "\${NEZHA_PORT}" || -z "\${NEZHA_KEY}" ]] && exit
}
# 下载最新版本 Nezha Agent
download_agent() {
  if [ ! -e nezha-agent ]; then
    URL=\$(wget -qO- -4 "https://api.github.com/repos/naiba/nezha/releases/latest" | grep -o "https.*linux_amd64.zip")
    wget -t 2 -T 10 -N \${URL}
    unzip -qod ./ nezha-agent_linux_amd64.zip && rm -f nezha-agent_linux_amd64.zip
  fi
}
# 运行客户端
run() {
  [[ ! \$PROCESS =~ nezha-agent && -e nezha-agent ]] && ./nezha-agent -s \${NEZHA_SERVER}:\${NEZHA_PORT} -p \${NEZHA_KEY} 2>&1 &
}
check_run
check_variable
download_agent
run
EOF
}
generate_config() {
  cat > config.json << EOF
{
    "log": {
        "loglevel": "none"
    },
    "dns": {
        "servers": ["https+local://mozilla.cloudflare-dns.com/dns-query"]
    },
    "inbounds": [
        {
            "listen": "0.0.0.0",
            "listen": "::",
            "port": 8100,
            "protocol": "vmess",
            "settings": {
                "clients": [
                    {
                        "id": "${UUID}"
                    }
                ]
            },
            "streamSettings": {
                "network": "ws",
                "security": "none",
                "wsSettings": {
                    "path": "/vmess"
                }
            },
            "sniffing": {
              "enabled": true,
              "destOverride": ["http", "tls", "quic"],
              "metadataOnly": false
            }
        }
    ],
    "outbounds": [
        {
            "protocol": "freedom"
        }
    ]
}
EOF
}

get_latest_version() {
    # Get latest release version number
    RELEASE_LATEST="$(curl -IkLs -o ${TMP_DIRECTORY}/NUL -w %{url_effective} https://github.com/XTLS/Xray-core/releases/latest | grep -o "[^/]*$")"
    RELEASE_LATEST="v${RELEASE_LATEST#v}"
    if [ -z "$RELEASE_LATEST" ]; then
        echo "error: Failed to get the latest release version, please check your network."
        exit 1
    fi
}

download_xray() {
    DOWNLOAD_LINK="https://github.com/XTLS/Xray-core/releases/download/$RELEASE_LATEST/Xray-linux-64.zip"
    if ! wget -qO "$ZIP_FILE" "$DOWNLOAD_LINK"; then
        echo 'error: Download failed! Please check your network or try again.'
        return 1
    fi
    return 0
    if ! wget -qO "$ZIP_FILE.dgst" "$DOWNLOAD_LINK.dgst"; then
        echo 'error: Download failed! Please check your network or try again.'
        return 1
    fi
    if [[ "$(cat "$ZIP_FILE".dgst)" == 'Not Found' ]]; then
        echo 'error: This version does not support verification. Please replace with another version.'
        return 1
    fi

    # Verification of Xray archive
    for LISTSUM in 'md5' 'sha1' 'sha256' 'sha512'; do
        SUM="$(${LISTSUM}sum "$ZIP_FILE" | sed 's/ .*//')"
        CHECKSUM="$(grep ${LISTSUM^^} "$ZIP_FILE".dgst | grep "$SUM" -o -a | uniq)"
        if [[ "$SUM" != "$CHECKSUM" ]]; then
            echo 'error: Check failed! Please check your network or try again.'
            return 1
        fi
    done
}

decompression() {
    unzip -q "$1" -d "$TMP_DIRECTORY"
    EXIT_CODE=$?
    if [ ${EXIT_CODE} -ne 0 ]; then
        "rm" -r "$TMP_DIRECTORY"
        echo "removed: $TMP_DIRECTORY"
        exit 1
    fi
}

install_xray() {
    install -m 755 ${TMP_DIRECTORY}/xray ./xray
    mv ${TMP_DIRECTORY}/geoip.dat ./geoip.dat
}

cleanup() {
    rm -r "$TMP_DIRECTORY"
    return 1
}

generate_nzxray
generate_config
get_latest_version
download_xray
decompression "$ZIP_FILE"
install_xray
cleanup
[ -e nezha.sh ] && bash nezha.sh
echo $UUID
