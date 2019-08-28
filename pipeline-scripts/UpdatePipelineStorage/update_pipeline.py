from azure.cosmosdb.table.tableservice import TableService
from azure.cosmosdb.table.models import Entity
import sys
import uuid

def generate_row_key():
    return str(uuid.uuid4()).split('-')[-1]

# Performs a look up based on filter_name:filter_value for the pipeline to update its details
def update_pipeline(account_name, account_key, table_name, partition_name, filter_name, filter_value, name1, value1, name2=None, value2=None, name3=None, value3=None):
    table_service = TableService(account_name=account_name, account_key=account_key)
    entities = table_service.query_entities(table_name, filter=filter_name + " eq '"+ filter_value + "'")

    count = 0
    for entity in entities:
        count = count + 1
        add = False
        if name1 in entity and entity[name1] != value1.lower():
            add = True
        entity[name1] = value1.lower()

        if name2 != None and value2 != None:
            if name2 in entity and entity[name2] != value2.lower():
                add = True
            entity[name2] = value2.lower()
        
        if name3 != None and value3 != None:
            if name3 in entity and entity[name3] != value3.lower():
                add = True
            entity[name3] = value3.lower()

        if add == False:
            table_service.update_entity(table_name, entity)
            print("Updating existing entry")
        else:
            guid = generate_row_key()
            entity["RowKey"] = guid
            table_service.insert_entity(table_name, entity)
            print("Adding new entry since one already existed")
        print(entity)
        break

    if count == 0:
        add_pipeline(account_name, account_key, table_name, partition_name, filter_name, filter_value, name1, value1, name2, value2, name3, value3)
    print("Done")

def add_pipeline(account_name, account_key, table_name, partition_name, filter_name, filter_value, name1, value1, name2=None, value2=None, name3=None, value3=None):
    print("Adding a new entry")
    new_entry = {}
    new_entry["RowKey"] = generate_row_key()
    new_entry["PartitionKey"] = partition_name
    new_entry[filter_name] = filter_value
    new_entry[name1] = value1.lower()
    if name2 != None and value2 != None:
        new_entry[name2] = value2.lower()
    if name3 != None and value3 != None:
        new_entry[name3] = value3.lower()
    print(new_entry)
    table_service = TableService(account_name=account_name, account_key=account_key)
    table_service.insert_entity(table_name, new_entry)


def list_all_entities(account_name, account_key, table_name):
    table_service = TableService(account_name=account_name, account_key=account_key)
    entities = table_service.query_entities(table_name)
    for entity in entities:
        print(entity)

if __name__ == "__main__":
    print(len(sys.argv))
    if len(sys.argv) == 9:
        update_pipeline(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6], sys.argv[7], sys.argv[8])
    elif len(sys.argv) == 11:
        update_pipeline(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6], sys.argv[7], sys.argv[8], sys.argv[9], sys.argv[10])
    elif len(sys.argv) == 13:
        update_pipeline(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6], sys.argv[7], sys.argv[8], sys.argv[9], sys.argv[10], sys.argv[11], sys.argv[12])
    elif len(sys.argv) == 4:
        list_all_entities(sys.argv[1], sys.argv[2], sys.argv[3])