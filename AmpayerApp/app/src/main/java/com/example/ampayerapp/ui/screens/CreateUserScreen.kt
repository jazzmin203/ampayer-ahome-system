package com.example.ampayerapp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.example.ampayerapp.data.api.RetrofitInstance
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateUserScreen(token: String) {
    var username by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var firstName by remember { mutableStateOf("") }
    var lastName by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("ampayer") } // default
    var password by remember { mutableStateOf("") }

    val roles = listOf("admin", "ampayer")
    var expandedRole by remember { mutableStateOf(false) }

    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    Scaffold(
        topBar = { CenterAlignedTopAppBar(title = { Text("Crear Usuario") }) },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            FloatingActionButton(onClick = {
                if (username.isBlank() || password.isBlank()) {
                    scope.launch { snackbarHostState.showSnackbar("Usuario y contraseña son obligatorios") }
                    return@FloatingActionButton
                }

                scope.launch {
                    try {
                        val newUser = com.example.ampayerapp.data.api.UserDto( username = username, email = email, first_name = firstName, last_name = lastName, role = role, password = password )
                        withContext(Dispatchers.IO) {
                            RetrofitInstance.api.createAmpayer("Bearer $token", newUser)
                        }

                        snackbarHostState.showSnackbar("Usuario creado correctamente")

                        // Limpiar campos
                        username = ""
                        email = ""
                        firstName = ""
                        lastName = ""
                        password = ""
                        role = "ampayer"
                    } catch (e: Exception) {
                        snackbarHostState.showSnackbar("Error: ${e.message}")
                    }
                }
            }) {
                Icon(Icons.Default.Add, contentDescription = "Crear Usuario")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(16.dp)
                .fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedTextField(
                value = username,
                onValueChange = { username = it },
                label = { Text("Usuario") },
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email") },
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = firstName,
                onValueChange = { firstName = it },
                label = { Text("Nombre") },
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = lastName,
                onValueChange = { lastName = it },
                label = { Text("Apellido") },
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Contraseña") },
                modifier = Modifier.fillMaxWidth(),
                visualTransformation = PasswordVisualTransformation()
            )

            // Selector de rol
            ExposedDropdownMenuBox(
                expanded = expandedRole,
                onExpandedChange = { expandedRole = !expandedRole }
            ) {
                OutlinedTextField(
                    value = role,
                    onValueChange = {},
                    label = { Text("Rol") },
                    readOnly = true,
                    modifier = Modifier.menuAnchor().fillMaxWidth()
                )
                ExposedDropdownMenu(
                    expanded = expandedRole,
                    onDismissRequest = { expandedRole = false }
                ) {
                    roles.forEach { r ->
                        DropdownMenuItem(
                            text = { Text(r) },
                            onClick = {
                                role = r
                                expandedRole = false
                            }
                        )
                    }
                }
            }
        }
    }
}
