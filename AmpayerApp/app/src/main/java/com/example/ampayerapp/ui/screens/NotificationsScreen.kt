package com.example.ampayerapp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.example.ampayerapp.data.api.Notification
import com.example.ampayerapp.data.api.RetrofitInstance
import com.example.ampayerapp.data.api.StatusUpdateRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsScreen(token: String, navController: NavController) {
    var notifications by remember { mutableStateOf<List<Notification>>(emptyList()) }
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(token) {
        try {
            notifications = RetrofitInstance.api.getNotifications("Bearer $token")
        } catch (e: Exception) {
            scope.launch {
                snackbarHostState.showSnackbar("Error cargando notificaciones: ${e.message}")
            }
        }
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Notificaciones") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Volver")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ){
            items(notifications) { notif ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(4.dp),
                    elevation = CardDefaults.cardElevation(4.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(notif.message, style = MaterialTheme.typography.bodyMedium)
                        Text(
                            text = notif.gameStatus?.replaceFirstChar {
                                if (it.isLowerCase()) it.titlecase() else it.toString()
                            } ?: if (notif.isRead) "Leída" else "No leída",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        notif.gameId?.let { gameId ->
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(onClick = {
                                    scope.launch {
                                        try {
                                            RetrofitInstance.api.confirmAssignment(
                                                "Bearer $token",
                                                gameId,
                                                StatusUpdateRequest("confirmed")
                                            )
                                            snackbarHostState.showSnackbar("Asignación confirmada")
                                            notifications = notifications.map {
                                                if (it.id == notif.id) it.copy(gameStatus = "confirmed", isRead = true) else it
                                            }
                                        } catch (e: Exception) {
                                            snackbarHostState.showSnackbar("Error: ${e.message}")
                                        }
                                    }
                                }, enabled = notif.gameStatus in listOf("assigned", "pending")) {
                                    Text("Aceptar")
                                }

                                Button(onClick = {
                                    scope.launch {
                                        try {
                                            RetrofitInstance.api.rejectAssignment(
                                                "Bearer $token",
                                                gameId,
                                                StatusUpdateRequest("rejected")
                                            )
                                            snackbarHostState.showSnackbar("Asignación rechazada")
                                            notifications = notifications.map {
                                                if (it.id == notif.id) it.copy(gameStatus = "rejected", isRead = true) else it
                                            }
                                        } catch (e: Exception) {
                                            snackbarHostState.showSnackbar("Error: ${e.message}")
                                        }
                                    }
                                }, enabled = notif.gameStatus in listOf("assigned", "pending")) {
                                    Text("Rechazar")
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}