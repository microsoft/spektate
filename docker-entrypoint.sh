#!/usr/bin/env sh
set -eu
# mainstring={
for word in $(env | grep '^REACT_APP_*')
do
    key=${word%%=*}
    value=${word#*=}
    pair=$(echo "\"$key\":\"$value\"")
    echo "\"$key\":\"$value\""
    # mainstring="$mainstring $pair,"
    export $key=$value
done

# ts-node index.js
