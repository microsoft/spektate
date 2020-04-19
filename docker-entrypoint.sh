#!/usr/bin/env sh
set -eu
for word in $(env | grep '^REACT_APP_*')
do
    key=${word%%=*}
    value=${word#*=}
    pair=$(echo "\"$key\":\"$value\"")
    export $key=$value
done

cd backend
node server.js
