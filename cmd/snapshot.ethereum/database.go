package main

import (
	"fmt"
	"log/slog"
	"strconv"
	"strings"

	"gorm.io/gorm"
)

// storePositions in the database, by formatting a string to use to make
// the insertion. Thankfully we're protected by the datatype for this.
func storePositions(db *gorm.DB, pools []string, ids []int, amount0s, amount1s []string) error {
	// Gorm lacks the support for inserting arrays (we think) so this
	// is something we need to do. Ugly I know. Thankfully this isn't used super often.
	idsS := make([]string, len(ids))
	for i, id := range ids {
		idsS[i] = strconv.Itoa(id)
	}
	var bu strings.Builder
	for i, addr := range pools {
		fmt.Fprintf(&bu, `'%s'`, addr)
		if i != len(pools)-1 {
			bu.WriteRune(',')
		}
	}
	s := fmt.Sprintf(
		"SELECT snapshot_create_positions_1(ARRAY[%s], ARRAY[%s], ARRAY[%s], ARRAY[%s])",
		bu.String(),                 // pools
		strings.Join(idsS, ","),     // ids
		strings.Join(amount0s, ","), // amount0s
		strings.Join(amount1s, ","), // amount1s
	)
	slog.Debug("about to execute sql", "sql", s)
	err := db.Exec(s).Error
	return err
}
