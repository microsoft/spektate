/* tslint:disable */ 
import * as React from 'react';
const k8s = require('@kubernetes/client-node');
// const K8sConfig = require('kubernetes-client').config
// const Client = require('kubernetes-client').Client;

class Kubernetes extends React.Component {
    public render() {
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault();

        const k8sApi = kc.makeApiClient(k8s.Core_v1Api);
        // @ts-ignore
        k8sApi.listNamespacedPod('default').then((res) => {
            console.log(res.body);
        });

        return <div />;
    }

     
}

export default Kubernetes;