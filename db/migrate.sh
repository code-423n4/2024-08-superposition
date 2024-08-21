#!/bin/sh -u

dbmate -u "$1" -d migrations up
