#!/usr/bin/env sh
set -eu
mainstring={
for word in $(env | grep '^REACT_APP_*')
do
    key=${word%%=*}
    value=${word#*=}
    pair=$(echo "\"$key\":\"$value\"")
    mainstring="$mainstring $pair,"
done
mainstring="$mainstring}"

ENV_JSON=$(env | grep '^REACT_APP_*' | jq -c '. | split("\n") | map(select(. != "")) | map(split("=") | { (.[0]) : .[1] }) | reduce .[] as $item ({}; . * $item)' -R -s)
ESCAPED_ENV_JSON=$(echo $mainstring | sed 's/\"/\\\"/g' | sed 's/\//\\\//g' | tr -d '\n' | tr -d '[[:blank:]]')
sed -i 's/%REACT_APP_ENV%/'"$ESCAPED_ENV_JSON"'/g' /usr/share/nginx/html/index.html
exec "$@"