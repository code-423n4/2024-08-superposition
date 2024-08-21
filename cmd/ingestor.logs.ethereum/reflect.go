package main

import "reflect"

func setEventFields(a any, blockHash, transactionHash string, blockNo uint64, emitterAddr string) {
	v := reflect.Indirect(reflect.ValueOf(a)).Elem().Elem()
	v.FieldByName("BlockHash").SetString(blockHash)
	v.FieldByName("TransactionHash").SetString(transactionHash)
	v.FieldByName("BlockNumber").SetUint(blockNo)
	v.FieldByName("EmitterAddr").SetString(emitterAddr)
}
