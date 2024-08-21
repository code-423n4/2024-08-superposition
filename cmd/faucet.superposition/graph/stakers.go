package graph

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
)

// UrlModeratorsGraph to ask whether a user is currently staking and their
// point threshold
const UrlModeratorsGraph = "https://moderators.fluidity.money/"

// StakerCutoff to require before allowing to use the faucet
const StakerCutoff = 10_000

func IsUserStaker(wallet string) (bool, error) {
	buf := strings.NewReader(fmt.Sprintf(`{"query":"query {\n  getStakingInformation(addresses: [\n    \"%v\"\n  ]) {\n    points\n  }\n}"}`, wallet))
	resp, err := http.Post(UrlModeratorsGraph, "application/json", buf)
	if err != nil {
		return false, err
	}
	var data struct {
		Data map[string][]map[string]any `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return false, err
	}
	stakerInfo := data.Data["getStakingInformation"]
	if len(stakerInfo) == 0 {
		return false, fmt.Errorf("nothing returned from data")
	}
	var isStaker bool
	staker := stakerInfo[0]["points"]
	s, _ := staker.(string)
	v, err := strconv.Atoi(s)
	if err != nil {
		return false, fmt.Errorf("bad type conversion to int: %#v: %v", staker, err)
	}
	isStaker = v > StakerCutoff
	return isStaker, nil
}
