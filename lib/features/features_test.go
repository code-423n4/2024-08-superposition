package features

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestBasicFeatureEnabled(t *testing.T) {
	f := F{false, map[string]bool{
		"i'm alive!": true,
	}}
	assert.True(t, f.Is("i'm alive!"))
}

func TestBasicFeatureEverything(t *testing.T) {
	f := F{true, nil}
	assert.True(t, f.Is("i'm still standing!"))
}

func TestBasicFeatureNothing(t *testing.T) {
	f := F{false, nil}
	assert.False(t, f.Is("i'm still standing!"))
}

func TestPropagateErrorsUpOrNilEverything(t *testing.T) {
	f := F{true, nil}
	err := fmt.Errorf("error here")
	assert.Equal(t, err, f.On("i'm active!", func() error {
		return err
	}))
}

func TestPropagateErrorsNilEverything(t *testing.T) {
	f := F{true, nil}
	assert.Equal(t, nil, f.On("i'm active!", func() error {
		return nil
	}))
}
