package graph

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
)

// SiteVerifyUrl to use to check Turnstile with
const SiteVerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

// VerifyTurnstile by making a request to Cloudflare, returning an error
// if it happens, and false if we can't verify them upstream.
func VerifyTurnstile(secret, key string) (bool, error) {
	resp, err := http.PostForm(SiteVerifyUrl, url.Values{
		"secret":   {secret},
		"response": {key},
	})
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()
	switch s := resp.StatusCode; s {
	case http.StatusOK, http.StatusAccepted:
		// Do nothing
	default:
		var buf bytes.Buffer
		_, _ = buf.ReadFrom(resp.Body)
		err = fmt.Errorf("unusual status code (resp %#v): %v", buf.String(), s)
		return false, err
	}
	var d struct {
		Success    bool  `json:"success"`
		ErrorCodes []int `json:"error_codes"`
	}
	var buf bytes.Buffer
	if _, err := buf.ReadFrom(resp.Body); err != nil {
		return false, err
	}
	buf2 := buf
	if err := json.NewDecoder(&buf).Decode(&d); err != nil {
		return false, fmt.Errorf("error decoding %#v: %v", buf2.String(), err)
	}
	if e := d.ErrorCodes; len(e) > 0 {
		return false, fmt.Errorf("returned error codes: %v", e)
	}
	success := d.Success
	return success, nil
}
