package com.example.ampayerapp.data.model

enum class UserRole {
    ADMIN,
    USER, // Puedes añadir más roles si los tienes
    UNKNOWN;

    companion object {
        // Función para convertir el String de la API a nuestro enum de forma segura
        fun fromString(value: String?): UserRole {
            return when (value?.lowercase()) { // lo convierte a minúsculas para no fallar
                "admin" -> ADMIN
                "user" -> USER
                else -> UNKNOWN
            }
        }
    }
}