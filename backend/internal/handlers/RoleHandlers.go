package handlers

import (
	"database/sql"
	_ "database/sql"
	"dta770/internal/database"
	"encoding/json"
	"net/http"
)

type Role struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

func RolesHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GetRolesHandler(w, r)
	case http.MethodPost:
		CreateRoleHandler(w, r)
	case http.MethodPut:
		UpdateRoleHandler(w, r)
	case http.MethodDelete:
		DeleteRoleHandler(w, r)
	default:
		http.Error(w, "متد غیرمجاز", http.StatusMethodNotAllowed)
	}
}

func GetRolesHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query("SELECT id, name, description FROM roles")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer func(rows *sql.Rows) {
		err := rows.Close()
		if err != nil {
		}
	}(rows)

	var roles []Role

	for rows.Next() {
		var role Role
		err := rows.Scan(&role.ID, &role.Name, &role.Description)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		roles = append(roles, role)
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(roles)
	if err != nil {
		return
	}
}

func CreateRoleHandler(w http.ResponseWriter, r *http.Request) {
	var role Role

	err := json.NewDecoder(r.Body).Decode(&role)
	if err != nil {
		http.Error(w, "داده نامعتبر", http.StatusBadRequest)
		return
	}

	err = database.DB.QueryRow(
		"INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id",
		role.Name,
		role.Description,
	).Scan(&role.ID)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(role)
}

func UpdateRoleHandler(w http.ResponseWriter, r *http.Request) {
	var role Role

	err := json.NewDecoder(r.Body).Decode(&role)
	if err != nil {
		http.Error(w, "داده نامعتبر", http.StatusBadRequest)
		return
	}

	_, err = database.DB.Exec(
		"UPDATE roles SET name=$1, description=$2 WHERE id=$3",
		role.Name,
		role.Description,
		role.ID,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func DeleteRoleHandler(w http.ResponseWriter, r *http.Request) {
	var data struct {
		ID int `json:"id"`
	}

	err := json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		http.Error(w, "داده نامعتبر", http.StatusBadRequest)
		return
	}

	_, err = database.DB.Exec("DELETE FROM roles WHERE id=$1", data.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
