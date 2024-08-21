// types that are reused across our stack. Aggressively converts itself
// whenever it can to a lower representation for comparison later.
// Numbers however are written to the database in a decoded form.
// The reason for this is that it enables data work on the underlying numbers,
// without creating issue in the representation in the clients.

package types

import (
	sqlDriver "database/sql/driver"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/big"
	"strings"
)

type (
	// Hash from a transaction
	Hash string
	// Address to designate a wallet
	Address string
	// Data to designate a large byte array
	Data string
)

// Number that represents something informational (ie, a large block
// number)
type Number struct{ *big.Int }

// UnscaledNumber that's representing a large number that needs to be
// divided by the decimals
type UnscaledNumber struct{ *big.Int }

// UsdNumber conversion of an amount at the time
type UsdNumber struct{ *big.Rat }

func EmptyNumber() Number {
	return Number{new(big.Int)}
}
func NumberFromBig(v *big.Int) Number {
	i := new(big.Int).Set(v)
	return Number{i}
}
func NumberFromInt32(v int32) Number {
	i := new(big.Int).SetInt64(int64(v))
	return Number{i}
}
func NumberFromInt64(v int64) Number {
	i := new(big.Int).SetInt64(v)
	return Number{i}
}
func NumberFromUint64(v uint64) Number {
	i := new(big.Int).SetUint64(v)
	return Number{i}
}
func NumberFromBase10(v string) (*Number, error) {
	i, ok := new(big.Int).SetString(v, 10)
	if !ok {
		return nil, fmt.Errorf("bad string")
	}
	n := NumberFromBig(i)
	return &n, nil
}
func NumberFromHex(v string) (*Number, error) {
	i, ok := new(big.Int).SetString(v, 16)
	if !ok {
		return nil, fmt.Errorf("bad string")
	}
	n := NumberFromBig(i)
	return &n, nil
}
func (u Number) Hex() string {
	if u.Int == nil {
		return "0"
	}
	return u.Int.Text(16)
}

// String the Number, printing its base10
func (u Number) String() string {
	if u.Int == nil {
		return "0"
	}
	return u.Int.Text(10)
}
func (u Number) Big() *big.Int {
	if u.Int == nil {
		return big.NewInt(0)
	}
	return new(big.Int).Set(u.Int)
}
func (u Number) Value() (sqlDriver.Value, error) {
	if u.Int == nil {
		return nil, nil
	}
	// Use the underlying Int String method to get an actual number.
	return u.Int.String(), nil
}

// Scan types into Number, supporting NUMERIC(78, 0), int64, uint64, string
func (int *Number) Scan(v interface{}) error {
	if v == nil {
		return nil
	}
	switch c := v.(type) {
	case string:
		int_, err := NumberFromBase10(v.(string))
		if err != nil {
			return fmt.Errorf(
				"failed to scan string! %v",
				err,
			)
		}
		*int = *int_
	case int64:
		n := NumberFromInt64(c)
		*int = n
	case uint64:
		n := NumberFromUint64(c)
		*int = n
	default:
		return fmt.Errorf(
			"failed to scan type %T content %v into the Number type!",
			v,
			v,
		)
	}
	return nil
}

func EmptyUnscaledNumber() UnscaledNumber {
	return UnscaledNumber{new(big.Int)}
}
func UnscaledNumberFromBig(v *big.Int) UnscaledNumber {
	i := new(big.Int).Set(v)
	return UnscaledNumber{i}
}
func UnscaledNumberFromInt64(v int64) UnscaledNumber {
	i := new(big.Int).SetInt64(v)
	return UnscaledNumber{i}
}
func UnscaledNumberFromBase10(v string) (*UnscaledNumber, error) {
	i, ok := new(big.Int).SetString(v, 10)
	if !ok {
		return nil, fmt.Errorf("bad string")
	}
	n := UnscaledNumberFromBig(i)
	return &n, nil
}
func UnscaledNumberFromHex(v string) (*UnscaledNumber, error) {
	i, ok := new(big.Int).SetString(v, 16)
	if !ok {
		return nil, fmt.Errorf("bad string")
	}
	n := UnscaledNumberFromBig(i)
	return &n, nil
}
func (u UnscaledNumber) Hex() string {
	return u.Int.Text(16)
}

// String the UnscaledNumber, printing its base 10 form
func (u UnscaledNumber) String() string {
	return u.Int.Text(10)
}
func (u UnscaledNumber) Big() *big.Int {
	return new(big.Int).Set(u.Int)
}
func (u UnscaledNumber) Value() (sqlDriver.Value, error) {
	// Use the underlying Int String method to get an actual number.
	return u.Int.String(), nil
}
func (u *UnscaledNumber) Scan(v interface{}) error {
	if v == nil {
		return nil
	}
	n := new(Number)
	err := n.Scan(v)
	if err != nil {
		return err
	}
	b := UnscaledNumberFromBig(n.Big())
	*u = b
	return nil
}

// Scale a number for visualisation or low-stakes math.
func (u UnscaledNumber) Scale(decimals int) *big.Float {
	f := new(big.Float).SetInt(u.Int)
	i := new(big.Int).SetInt64(10)
	i.Exp(i, new(big.Int).SetInt64(int64(decimals)), nil)
	return f.Quo(f, new(big.Float).SetInt(i))
}

// ScaleStr to show a user or to send over the graph, scaling with 4 decimal places.
func (u UnscaledNumber) ScaleStr(d int) string {
	if d == 0 {
		return u.String()
	}
	return fmt.Sprintf("%.8f", u.Scale(d))
}

func HashFromString(s string) Hash {
	return Hash(strings.ToLower(s))
}
func (h Hash) String() string {
	return strings.ToLower(string(h))
}
func (h Hash) Value() (sqlDriver.Value, error) {
	return h.String(), nil
}

func AddressFromString(s string) Address {
	return Address(strings.ToLower(s))
}
func (a Address) String() string {
	return strings.ToLower(string(a))
}
func (a Address) Value() (sqlDriver.Value, error) {
	return a.String(), nil
}
func (a *Address) UnmarshalJSON(b []byte) error {
	var s string
	if err := json.Unmarshal(b, &s); err != nil {
		return err
	}
	*a = AddressFromString(s)
	return nil
}

func DataFromString(s string) Data {
	return Data(strings.ToLower(s))
}
func DataFromBytes(b []byte) Data{
	return Data("0x"+hex.EncodeToString(b))
}
func (a Data) String() string {
	return strings.ToLower(string(a))
}
func (d Data) Value() (sqlDriver.Value, error) {
	return d.String(), nil
}
func (d Data) Bytes() ([]byte, error) {
	return hex.DecodeString(strings.TrimPrefix(string(d), "0x"))
}
