package com.example.ampayerapp.data.datastore

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "session_prefs")

class SessionManager(context: Context) {

    private val dataStore = context.dataStore

    companion object {
        val TOKEN_KEY = stringPreferencesKey("token")
        val USERNAME_KEY = stringPreferencesKey("username")
        val ROLE_KEY = stringPreferencesKey("role")
        val USER_ID_KEY = stringPreferencesKey("user_id")
    }

    // --- Flujos de datos ---
    val tokenFlow: Flow<String?> = dataStore.data.map { prefs -> prefs[TOKEN_KEY] }

    val roleFlow: Flow<String?> = dataStore.data.map { prefs ->
        prefs[ROLE_KEY]?.trim()?.lowercase() // Normalizamos aquí también
    }

    val userIdFlow: Flow<Int> = dataStore.data.map { prefs ->
        prefs[USER_ID_KEY]?.toIntOrNull() ?: 0
    }

    // --- Métodos de guardado ---
    suspend fun saveToken(token: String) {
        dataStore.edit { prefs -> prefs[TOKEN_KEY] = token }
    }

    suspend fun saveUserId(userId: Int) {
        dataStore.edit { prefs -> prefs[USER_ID_KEY] = userId.toString() }
    }

    /**
     * Guarda la sesión completa.
     * Normaliza el rol automáticamente: trim + lowercase
     */
    suspend fun saveSession(token: String, role: String, userId: Int) {
        val normalizedRole = role.trim().lowercase()
        dataStore.edit { prefs ->
            prefs[TOKEN_KEY] = token
            prefs[ROLE_KEY] = normalizedRole
            prefs[USER_ID_KEY] = userId.toString()
        }
    }

    // --- Limpiar sesión ---
    suspend fun clearSession() {
        dataStore.edit { prefs -> prefs.clear() }
    }
}
