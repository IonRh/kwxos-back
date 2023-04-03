#!binsh
#!usrbinenv bash
echo "执行哪吒面板"
bash nezha.sh 2&1 &
echo "xray"
.xray -c config.json
