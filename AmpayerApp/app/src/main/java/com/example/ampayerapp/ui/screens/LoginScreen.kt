package com.example.ampayerapp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.example.ampayerapp.data.api.LoginRequest
import com.example.ampayerapp.data.api.RetrofitInstance
import com.example.ampayerapp.data.datastore.SessionManager
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(sessionManager: SessionManager, onLoginSuccess: () -> Unit) {
    val snackbarHostState = remember { SnackbarHostState() }
    var isRegistering by remember { mutableStateOf(false) }

    Scaffold(snackbarHost = { SnackbarHost(snackbarHostState) }) { padding ->
        Box(modifier = Modifier.padding(padding).fillMaxSize(), contentAlignment = Alignment.Center) {
            if (isRegistering) {
                RegisterForm(
                    snackbarHostState = snackbarHostState,
                    onCancel = { isRegistering = false }
                )
            } else {
                LoginForm(
                    sessionManager = sessionManager,
                    snackbarHostState = snackbarHostState,
                    onLoginSuccess = onLoginSuccess,
                    onRegisterClick = { isRegistering = true }
                )
            }
        }
    }
}

@Composable
fun LoginForm(
    sessionManager: SessionManager,
    snackbarHostState: SnackbarHostState,
    onLoginSuccess: () -> Unit,
    onRegisterClick: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }

    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(16.dp).fillMaxWidth()) {
        Text("Login", style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(value = username, onValueChange = { username = it }, label = { Text("Usuario o Email") }, singleLine = true)
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(value = password, onValueChange = { password = it }, label = { Text("Contraseña") }, singleLine = true, visualTransformation = PasswordVisualTransformation())
        Spacer(modifier = Modifier.height(16.dp))

        Button(onClick = {
            if (username.isBlank() || password.isBlank()) {
                scope.launch { snackbarHostState.showSnackbar("Usuario y contraseña son obligatorios") }
                return@Button
            }
            scope.launch {
                loading = true
                try {
                    val response = RetrofitInstance.api.login(LoginRequest(username.trim(), password.trim()))
                    val payload = String(android.util.Base64.decode(response.access.split(".")[1], android.util.Base64.URL_SAFE or android.util.Base64.NO_PADDING or android.util.Base64.NO_WRAP))
                    val json = org.json.JSONObject(payload)
                    val role = json.getString("role").lowercase()
                    val userId = json.getInt("user_id")
                    sessionManager.saveSession(response.access, role, userId)
                    onLoginSuccess()
                } catch (e: Exception) {
                    e.printStackTrace()
                    snackbarHostState.showSnackbar("Usuario o contraseña incorrecta")
                } finally {
                    loading = false
                }
            }
        }, enabled = !loading, modifier = Modifier.fillMaxWidth()) {
            Text(if (loading) "Ingresando..." else "Login")
        }

        TextButton(onClick = onRegisterClick) { Text("Registrarse como Ampayer") }
    }
}

@Composable
fun RegisterForm(
    snackbarHostState: SnackbarHostState,
    onCancel: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var username by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var firstName by remember { mutableStateOf("") }
    var lastName by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }

    fun validate(): Boolean {
        if (username.isBlank() || email.isBlank() || password.isBlank()) {
            scope.launch { snackbarHostState.showSnackbar("Los campos Usuario, Email y Contraseña son obligatorios") }
            return false
        }
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            scope.launch { snackbarHostState.showSnackbar("Email no válido") }
            return false
        }
        if (password.length < 6) {
            scope.launch { snackbarHostState.showSnackbar("Contraseña debe tener al menos 6 caracteres") }
            return false
        }
        return true
    }

    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(16.dp).fillMaxWidth()) {
        Text("Registro de Ampayer", style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(value = username, onValueChange = { username = it }, label = { Text("Usuario") }, singleLine = true)
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("Email") }, singleLine = true)
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(value = firstName, onValueChange = { firstName = it }, label = { Text("Nombre") }, singleLine = true)
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(value = lastName, onValueChange = { lastName = it }, label = { Text("Apellido") }, singleLine = true)
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(value = password, onValueChange = { password = it }, label = { Text("Contraseña") }, singleLine = true, visualTransformation = PasswordVisualTransformation())
        Spacer(modifier = Modifier.height(16.dp))

        Button(onClick = {
            if (!validate()) return@Button
            scope.launch {
                loading = true
                try {
                    RetrofitInstance.api.createAmpayer(
                        token = "",
                        newUser = com.example.ampayerapp.data.api.UserDto(
                            username = username.trim(),
                            email = email.trim(),
                            first_name = firstName.trim(),
                            last_name = lastName.trim(),
                            role = "ampayer",
                            password = password.trim()
                        )
                    )
                    snackbarHostState.showSnackbar("Usuario registrado correctamente")
                    onCancel()
                    username = ""; email = ""; firstName = ""; lastName = ""; password = ""
                } catch (e: Exception) {
                    snackbarHostState.showSnackbar("Error: ${e.message}")
                } finally {
                    loading = false
                }
            }
        }, enabled = !loading, modifier = Modifier.fillMaxWidth()) {
            Text(if (loading) "Procesando..." else "Registrar")
        }

        TextButton(onClick = onCancel) { Text("Volver al login") }
    }
}
