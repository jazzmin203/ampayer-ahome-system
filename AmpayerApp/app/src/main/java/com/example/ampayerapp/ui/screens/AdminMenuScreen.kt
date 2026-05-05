import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.example.ampayerapp.R

data class DashboardItem(
    val iconRes: Int,
    val label: String,
    val route: String,
    val badgeCount: Int = 0
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminMenuScreen(navController: NavHostController, onLogout: () -> Unit) {
    val items = listOf(
        DashboardItem(R.drawable.ic_notifications, "Notificaciones", "notifications", badgeCount = 3),
        DashboardItem(R.drawable.ic_league, "Ligas", "create_league"),
        DashboardItem(R.drawable.ic_zone, "Zonas", "create_zone"),
        DashboardItem(R.drawable.ic_stadium, "Estadios", "create_stadium"),
        DashboardItem(R.drawable.ic_team, "Equipos", "create_team"),
        DashboardItem(R.drawable.ic_game, "Juegos", "create_game", badgeCount = 2),
        DashboardItem(R.drawable.ic_schedule, "Asignar Ampayers", "assign_ampayer", badgeCount = 1),
        DashboardItem(R.drawable.ic_ampayer, "Ampayers", "create_ampayer")
    )

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Panel Admin") },
                actions = {
                    IconButton(onClick = onLogout) {
                        Icon(
                            painter = painterResource(id = R.drawable.cerrarsesion),
                            contentDescription = "Cerrar sesión"
                        )
                    }
                }
            )
        }
    ) { padding ->

        LazyVerticalGrid(
            columns = GridCells.Fixed(3),
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(items) { item ->
                DashboardButton(item = item) {
                    navController.navigate(item.route)
                }
            }
        }
    }
}

@Composable
fun DashboardButton(item: DashboardItem, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(80.dp)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.TopEnd
    ) {

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.fillMaxSize()
        ) {
            Card(
                modifier = Modifier.size(60.dp),
                shape = CircleShape,
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0074D9))
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        painter = painterResource(id = item.iconRes),
                        contentDescription = item.label,
                        tint = Color.White,
                        modifier = Modifier.size(32.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = item.label,
                fontSize = 10.sp,
                maxLines = 1,
                color = Color.Black
            )
        }

        // Badge indicador
        if (item.badgeCount > 0) {
            Card(
                shape = CircleShape,
                colors = CardDefaults.cardColors(containerColor = Color.Red),
                modifier = Modifier
                    .size(20.dp)
                    .offset(x = 8.dp, y = (-8).dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = item.badgeCount.toString(),
                        fontSize = 10.sp,
                        color = Color.White
                    )
                }
            }
        }
    }
}
