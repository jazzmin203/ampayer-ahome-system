package com.example.ampayerapp.data.api

/**
 * Representa el modelo de un usuario, compatible con la API de Django.
 * Esta clase se usa tanto para recibir datos de la API como para enviarlos.
 */
/*data class User(
    val id: Int,
    val username: String,
    val email: String,
    val role: String,

    // El password es nullable (opcional) y no se serializa si es nulo.
    // - Se envía a la API solo al crear un nuevo usuario.
    // - La API nunca lo devuelve por seguridad.
    val password: String? = null
)*/
data class User(
    val id: Int? = null,
    val username: String,
    val email: String,
    val firstName: String? = null,
    val lastName: String? = null,
    val role: String,
    val password: String
)