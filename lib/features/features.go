// feature: enable certain features in the code based on what's provided
// from our bucket, or with environment variables. Mocks out a new
// internal type that is requested from the func method to know what's
// enabled.

package features

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"strings"

	"github.com/fluidity-money/long.so/lib/setup"
)

// EnvFeatures to enable at runtime from env (optionally)
const EnvFeatures = "SPN_FEATURES"

// FeaturesBucket where a JSON blob lives that contains each enabled
// feature in a map.
const FeaturesBucket = "https://features.long.so/features.json"

// Features that are supported in the code based on the bucket or env.
type F struct {
	everything bool            // everything enabled if * was set in the env
	enabled    map[string]bool // enabled features
}

// Get some feature functionality support. Make a request if it's needed,
// or use EnvFeatures.
func Get() F {
	f := get()
	slog.Debug("enabled features",
		"features", f.enabled,
		"everything enabled?", f.everything,
	)
	return f
}

func get() F {
	// If SPN_FEATURES is not empty, then we set up the features based on the
	// arguments, assuming a dev is testing. Otherwise, we make a request.
	switch v := os.Getenv(EnvFeatures); v {
	case "":
		// Set up with a request from our bucket.
		return getFromBucket()
	case "*":
		// Everything should be enabled on request!
		return F{true, nil}
	case "none":
		return F{false, nil}
	default:
		keys := strings.Split(v, ",")
		enabled := make(map[string]bool, len(keys))
		for _, key := range keys {
			enabled[key] = true
		}
		return F{false, enabled}
	}
}

func getFromBucket() F {
	r, err := http.Get(FeaturesBucket)
	if err != nil {
		setup.Exitf("features bucket: get: %v", err)
	}
	defer r.Body.Close()
	var enabled map[string]bool
	var buf bytes.Buffer // copy for logging if something goes wrong here.
	if _, err := buf.ReadFrom(r.Body); err != nil {
		setup.Exitf("features bucket: draining: %v", err)
	}
	buf2 := buf
	if err := json.NewDecoder(&buf).Decode(&enabled); err != nil {
		setup.Exitf("features bucket: decoding %#v: %v", buf2.String(), err)
	}
	return F{
		everything: false,
		enabled:    enabled,
	}
}

// Is the feature enabled for a specific binary "yes or no" question.
// Will enable everything if everything is enabled for features
// (development mode.)
func (f F) Is(name string) bool {
	return f.everything || f.enabled[name]
}

// OnFeature being enabled, run the thunk given.
func (f F) On(name string, k func() error) (r error) {
	if f.Is(name) {
		if err := k(); err != nil {
			r = err
		}
	}
	return
}
