package com.example.ampayerapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.example.ampayerapp.data.api.Game
import com.example.ampayerapp.data.api.RetrofitInstance
import com.example.ampayerapp.data.api.StatusUpdateRequest
import kotlinx.coroutines.launch
import java.time.LocalDate

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyAssignmentsScreen(token: String, ampayerId: Int, navController: NavHostController) {

    var games by remember { mutableStateOf<List<Game>>(emptyList()) }
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }
    val today = LocalDate.now()

    // 🔵 Cargar juegos desde la API
    LaunchedEffect(ampayerId, token) {
        scope.launch {
            try {
                games = RetrofitInstance.api.getGamesForAmpayer(
                    "Bearer $token",
                    ampayerId
                )
            } catch (e: Exception) {
                snackbarHostState.showSnackbar("Error al cargar juegos")
            }
        }
    }

    // 🎨 Fondo
    val backgroundBrush = Brush.verticalGradient(
        listOf(
            Color(0xFF001F3F),
            Color(0xFF0074D9),
            Color(0xFF7FDBFF)
        )
    )

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Mis asignaciones") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Volver")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(backgroundBrush)
                .padding(padding)
        ) {

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {

                // 🔵 Juegos de HOY
                item {
                    Text("Juegos de Hoy", color = Color.White)
                }

                items(games.filter { it.date == today.toString() }) { game ->
                    AssignmentCard(
                        game = game,
                        token = token,
                        ampayerId = ampayerId,
                        games = games,
                        onUpdate = { games = it },
                        snackbarHostState = snackbarHostState
                    )
                }

                // 🟢 Juegos FUTUROS
                item {
                    Spacer(Modifier.height(12.dp))
                    Text("Juegos Próximos", color = Color.White)
                }

                items(games.filter { it.date > today.toString() }) { game ->
                    AssignmentCard(
                        game = game,
                        token = token,
                        ampayerId = ampayerId,
                        games = games,
                        onUpdate = { games = it },
                        snackbarHostState = snackbarHostState
                    )
                }

                // 🟣 HISTORIAL
                item {
                    Spacer(Modifier.height(12.dp))
                    Text("Historial", color = Color.White)
                }

                items(games.filter { it.date < today.toString() }) { game ->
                    HistoryCard(game)
                }
            }
        }
    }
}

//////////////////////////////////////////////////////////
// 🔶 TARJETA: ASIGNACIÓN (con botones Aceptar / Rechazar)
//////////////////////////////////////////////////////////

@Composable
fun AssignmentCard(
    game: Game,
    token: String,
    ampayerId: Int,
    games: List<Game>,
    onUpdate: (List<Game>) -> Unit,
    snackbarHostState: SnackbarHostState
) {
    val scope = rememberCoroutineScope()

    val myAssignment = game.assignments_status.find { it.ampayerId == ampayerId }


    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.9f)),
        elevation = CardDefaults.cardElevation(6.dp)
    ) {
        Column(Modifier.padding(16.dp)) {

            Text("Liga: ${game.leagueName}")
            Text("Zona: ${game.zoneName}")
            Text("Estadio: ${game.stadiumName}")
            Text("Fecha: ${game.date}")
            Text("Hora: ${game.time ?: "-"}")
            Spacer(Modifier.height(6.dp))

            // Estado general
            Text("Estado del juego: ${game.status}")

            // Solo mostrar botones si estoy asignado y no he decidido
            val pendingStatuses = listOf("assigned", "pending", "sin_confirmar")

            if (pendingStatuses.contains(myAssignment?.status?.lowercase())) {
                Spacer(Modifier.height(8.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {

                    // 🔵 Confirmar
                    Button(
                        onClick = {
                            scope.launch {
                                try {
                                    val updatedGame =
                                        RetrofitInstance.api.confirmAssignment(
                                            "Bearer $token",
                                            game.id!!,
                                            StatusUpdateRequest("confirmed")
                                        )

                                    onUpdate(games.map {
                                        if (it.id == updatedGame.id) updatedGame else it
                                    })

                                    snackbarHostState.showSnackbar("Asignación confirmada")
                                } catch (e: Exception) {
                                    snackbarHostState.showSnackbar("Error: ${e.message}")
                                }
                            }
                        }
                    ) {
                        Text("Aceptar")
                    }

                    // 🔴 Rechazar
                    Button(
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Red),
                        onClick = {
                            scope.launch {
                                try {
                                    val updatedGame =
                                        RetrofitInstance.api.rejectAssignment(
                                            "Bearer $token",
                                            game.id!!,
                                            StatusUpdateRequest("rejected")
                                        )

                                    onUpdate(games.map {
                                        if (it.id == updatedGame.id) updatedGame else it
                                    })

                                    snackbarHostState.showSnackbar("Asignación rechazada")
                                } catch (e: Exception) {
                                    snackbarHostState.showSnackbar("Error: ${e.message}")
                                }
                            }
                        }
                    ) {
                        Text("Rechazar")
                    }
                }
            }
        }
    }
}

//////////////////////////////////////////
// 🔷 TARJETA HISTORIAL (solo lectura)
//////////////////////////////////////////

@Composable
fun HistoryCard(game: Game) {

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.6f)),
        elevation = CardDefaults.cardElevation(4.dp)
    ) {

        Column(Modifier.padding(16.dp)) {
            Text("Liga: ${game.leagueName}")
            Text("Zona: ${game.zoneName}")
            Text("Estadio: ${game.stadiumName}")
            Text("Fecha: ${game.date}")
            Text("Hora: ${game.time}")
            Text("Estado final: ${game.status}")
        }
    }
}
