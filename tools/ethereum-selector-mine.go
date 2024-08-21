// ethereum-selector-mine: mine permutations of the function given of the
// kind (_[0-9a-zA-Z]+), until it corresponds to a magic byte that we
// want for the first character of the function's selector. Takes characters
// and converts them to upper (thanks Stylus...)

package main

import (
	"bytes"
	"encoding/hex"
	"fmt"
	"math/rand"
	"os"
	"runtime"
	"strconv"
	"strings"
	"time"

	ethCrypto "github.com/ethereum/go-ethereum/crypto"
)

func main() {
	sig := os.Args[1]
	if sig == "" {
		return
	}
	desired_, err := strconv.Atoi(os.Args[2])
	if err != nil {
		panic(err)
	}
	desired := byte(desired_)
	p := strings.Index(sig, "(")
	done := make(chan string)
	for i := 0; i < runtime.NumCPU(); i++ {
		i := i
		go func() {
			r := rand.New(rand.NewSource(time.Now().Unix() + int64(i)))
			for {
				b := make([]byte, 4)
				if _, err := r.Read(b); err != nil {
					panic(err)
				}
				s := strings.ToUpper(hex.EncodeToString(b))
				f := string(sig[:p]) + s + string(sig[p:])
				k := ethCrypto.Keccak256([]byte(f))
				if bytes.Compare(k[:2], []byte{0, 0}) == 0 {
					if k[2] == desired {
						done <- f
					}
				}
			}
		}()
	}
	fmt.Println(<-done)
}
