package seawater

type Classification string

const (
	ClassificationStablecoin Classification = "STABLECOIN"
	ClassificationVolatile   Classification = "VOLATILE"
	ClassificationUnknown    Classification = "UNKNOWN"
)
