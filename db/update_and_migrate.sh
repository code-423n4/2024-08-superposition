#!/bin/bash

# Navigate to the specified directory
cd /home/ec2-user/amm.superposition.so/db/migrations || exit

# Perform a git pull
git_output=$(git pull)

# Check if there are changes
if [[ $git_output != "Already up to date." ]]; then
    echo "Changes detected, running dbmate..."
    dbmate -u "$SPN_TIMESCALE" -d . up
else
    echo "No changes detected."
fi
