package com.example.ampayerapp.ui.screens

import AmpayerDialog
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.example.ampayerapp.data.api.RetrofitInstance
import com.example.ampayerapp.data.api.UserDto
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateAmpayerScreen(token: String,navController: NavController) {
    var ampayers by remember { mutableStateOf<List<UserDto>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var showDialog by remember { mutableStateOf(false) }
    var editingUser by remember { mutableStateOf<UserDto?>(null) }
    var snackbarMessage by remember { mutableStateOf<String?>(null) }

    val scope = rememberCoroutineScope()

    // Función para cargar ampayers
    fun loadAmpayers() {
        scope.launch {
            isLoading = true
            try {
                ampayers = RetrofitInstance.api.getAmpayers("Bearer $token", "ampayer")
            } catch (e: Exception) {
                snackbarMessage = "Error cargando ampayers"
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(Unit) { loadAmpayers() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Ampayers") },
                navigationIcon = {
                    IconButton(onClick = {
                        navController.navigate(AppDestinations.ADMIN_MENU) {
                            popUpTo(AppDestinations.ADMIN_MENU) { inclusive = true }
                        }
                    }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Volver al Menú")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { editingUser = null; showDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "Agregar Ampayer")
            }
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {

            // Indicador de carga
            if (isLoading) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            } else {
                // Lista de ampayers
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(ampayers) { user ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(8.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(user.username)
                            Row {
                                IconButton(onClick = { editingUser = user; showDialog = true }) {
                                    Icon(Icons.Default.Edit, contentDescription = "Editar")
                                }
                                IconButton(onClick = {
                                    user.id?.let { id ->
                                        scope.launch {
                                            try {
                                                RetrofitInstance.api.deleteAmpayer("Bearer $token", id)
                                                snackbarMessage = "Ampayer eliminado"
                                                loadAmpayers()
                                            } catch (e: Exception) {
                                                snackbarMessage = "Error al eliminar"
                                            }
                                        }
                                    } ?: run {
                                        snackbarMessage = "Error: ID no disponible"
                                    }
                                }) {
                                    Icon(Icons.Default.Delete, contentDescription = "Eliminar")
                                }
                            }
                        }
                    }
                }
            }

            // Diálogo para crear/editar ampayer
            if (showDialog) {
                AmpayerDialog(
                    token = token,
                    user = editingUser,
                    onDismiss = { showDialog = false },
                    onSaved = { loadAmpayers(); showDialog = false; snackbarMessage = "Ampayer guardado" }
                )
            }

            // Snackbar
            snackbarMessage?.let { msg ->
                Snackbar(
                    modifier = Modifier.padding(8.dp),
                    action = { TextButton(onClick = { snackbarMessage = null }) { Text("OK") } }
                ) { Text(msg) }
            }
        }
    }
}
