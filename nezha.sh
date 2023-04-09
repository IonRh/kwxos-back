#!/usr/bin/env bash

# 哪吒的三个参数
NEZHA_SERVER=nezha-kwxos.fly.dev
NEZHA_PORT=5555
NEZHA_KEY=IBzioUyDii0TNqr860

# 三个变量不全则不安装哪吒客户端
check_variable() {
    [[ -z "${NEZHA_SERVER}" || -z "${NEZHA_PORT}" || -z "${NEZHA_KEY}" ]] && exit
}

# 运行客户端
run() {
    [ -e nezha-agent ] && chmod +x nezha-agent && ./nezha-agent -s ${NEZHA_SERVER}:${NEZHA_PORT} -p ${NEZHA_KEY}
}

check_variable
run
