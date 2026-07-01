package utils

// NullableTime تابع کمکیت رو هم اینجا بذار
func NullableTime(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
