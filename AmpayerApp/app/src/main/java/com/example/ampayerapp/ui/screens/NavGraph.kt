package com.example.ampayerapp.ui.screens

import AdminMenuScreen
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.example.ampayerapp.data.datastore.SessionManager
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

object AppDestinations {
    const val LOGIN = "login"
    const val DECISION = "decision"

    // Menús principales
    const val ADMIN_MENU = "admin_menu"
    const val AMPAYER_MENU = "ampayer_menu"

    // Pantallas Admin
    const val CREATE_LEAGUE = "create_league"
    const val CREATE_ZONE = "create_zone"
    const val CREATE_STADIUM = "create_stadium"
    const val CREATE_GAME = "create_game"
    const val ASSIGN_AMPAYER = "assign_ampayer"
    const val CREATE_AMPAYER = "create_ampayer"

    // Pantallas Ampayer
    const val MY_ASSIGNMENTS = "my_assignments"
    const val LEAGUES = "leagues"
    const val GAMES = "games"
    const val NOTIFICATIONS = "notifications"

    const val CREATE_TEAM = "create_team"
}

@Composable
fun NavGraph(
    sessionManager: SessionManager,
    navController: NavHostController,
    paddingValues: PaddingValues
) {
    // Obtenemos token y role de forma segura
    val token by sessionManager.tokenFlow.collectAsState(initial = "")
    val safeToken = token ?: "" // fallback si es null
    val role by sessionManager.roleFlow.collectAsState(initial = "")

    val scope = rememberCoroutineScope()

    NavHost(navController = navController, startDestination = AppDestinations.DECISION) {

        // --- Pantalla de decisión según rol ---
        composable(AppDestinations.DECISION) {
            LaunchedEffect(safeToken, role) {
                val nextDestination = when {
                    safeToken.isBlank() -> AppDestinations.LOGIN
                    role.equals("admin", ignoreCase = true) -> AppDestinations.ADMIN_MENU
                    role.equals("ampayer", ignoreCase = true) -> AppDestinations.AMPAYER_MENU
                    else -> AppDestinations.LOGIN
                }
                navController.navigate(nextDestination) {
                    popUpTo(AppDestinations.DECISION) { inclusive = true }
                }
            }
            LoadingScreen()
        }

        // --- Pantalla Login ---
        composable(AppDestinations.LOGIN) {
            LoginScreen(sessionManager = sessionManager) {
                // Usamos un scope para leer el rol guardado y navegar
                scope.launch {
                    val savedRole = sessionManager.roleFlow.first()?.trim()?.lowercase() ?: ""
                    val nextDestination = if (savedRole == "admin") AppDestinations.ADMIN_MENU
                    else AppDestinations.AMPAYER_MENU

                    navController.navigate(nextDestination) {
                        popUpTo(AppDestinations.LOGIN) { inclusive = true }
                    }
                }
            }
        }

        // --- Menús ---
        composable(AppDestinations.ADMIN_MENU) {
            AdminMenuScreen(
                navController = navController,
                onLogout = {
                    scope.launch {
                        sessionManager.clearSession() // limpia token, rol, id, etc.
                        navController.navigate(AppDestinations.LOGIN) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                }
            )
        }
        composable(AppDestinations.AMPAYER_MENU) {
            AmpayerMenuScreen(
                navController = navController,
                onLogout = {
                    scope.launch {
                        sessionManager.clearSession()
                        navController.navigate(AppDestinations.LOGIN) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                }
            )
        }

        // --- CRUD/Admin ---
        composable(AppDestinations.CREATE_LEAGUE) { CreateLeagueScreen(token = safeToken, navController = navController)  }
        composable(AppDestinations.CREATE_ZONE) { CreateZoneScreen(token = safeToken , navController = navController)  }
        composable(AppDestinations.CREATE_STADIUM) { CreateStadiumScreen(token = safeToken, navController = navController)  }
        composable(AppDestinations.CREATE_TEAM) { CreateTeamScreen(token = safeToken , navController = navController)  }
        composable(AppDestinations.CREATE_GAME) { CreateGameScreen(token = safeToken , navController = navController)  }
        composable(AppDestinations.ASSIGN_AMPAYER) { AssignAmpayerScreen(token = safeToken , navController = navController)  }
        composable(AppDestinations.CREATE_AMPAYER) { CreateAmpayerScreen(token = safeToken , navController = navController)  }

        // --- Pantallas Ampayer ---
        composable(AppDestinations.MY_ASSIGNMENTS) {
            val ampayerId by sessionManager.userIdFlow.collectAsState(initial = 0)
            MyAssignmentsScreen(token = safeToken, ampayerId,navController = navController)
        }

        composable(AppDestinations.LEAGUES) {
            val ampayerId by sessionManager.userIdFlow.collectAsState(initial = 0)
            LeagueScreen(token = safeToken, ampayerId) { leagueId ->
                navController.navigate("${AppDestinations.GAMES}?leagueId=$leagueId")
            }
        }

        composable(AppDestinations.GAMES) { CreateGameScreen(token = safeToken, navController = navController)  }
        composable(AppDestinations.NOTIFICATIONS) { NotificationsScreen(token = safeToken, navController = navController)  }
    }
}

@Composable
private fun LoadingScreen() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator()
    }
}
