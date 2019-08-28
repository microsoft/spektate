import logging
import json
# from update_pipeline import *
from .update_pipeline import *
import azure.functions as func

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')

    try:
        req_body = req.get_json()
    except ValueError as ve:
        logging.error("Error: Unable to decode POST body. Error: " + repr(ve))
        return func.HttpResponse(
            status_code=400,
            body=json.dumps({"Error": "Unable to decode POST body " + repr(ve)})
        )
    else:
        account_name = req_body.get('account_name')
        account_key = req_body.get('account_key')
        table_name = req_body.get('table_name')
        partition_key = req_body.get('partition_key')
        filter_name = req_body.get('filter_name')
        filter_value = req_body.get('filter_value')
        name1 = req_body.get('name1')
        value1 = req_body.get('value1')
        name2 = req_body.get('name2')
        value2 = req_body.get('value2')
        name3 = req_body.get('name3')
        value3 = req_body.get('value3')
        if account_name and account_key and table_name and partition_key and filter_name and filter_value and name1 and value1:
            update_pipeline(account_name, account_key, table_name, partition_key, filter_name, filter_value, name1, value1, name2, value2, name3, value3)

        return func.HttpResponse(
             "Sent request",
             status_code=400
        )
