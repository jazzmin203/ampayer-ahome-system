package com.example.ampayerapp.data.api

import com.google.gson.annotations.SerializedName
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import java.util.concurrent.TimeUnit


/** ------------------ MODELOS ------------------ **/

// 🔐 Autenticación
data class LoginRequest(val username: String, val password: String)
data class LoginResponse(val access: String, val refresh: String, val role: String)

// 👤 Usuarios / Ampayers
data class ApiUser(
    val id: Int,
    val username: String,
    val email: String,
    val role: String,
    val password: String? = null
)

data class UserDto(
    val id: Int? = null,
    val username: String,
    val email: String,
    @SerializedName("first_name") val first_name: String,
    @SerializedName("last_name") val last_name: String,
    val role: String,
    val password: String? = null
    //val password: String? = null
)


// Data classes
data class UserRequest(
    val username: String,
    val email: String,
    val first_name: String,
    val last_name: String,
    val password: String
)

data class UserResponse(
    val id: Int,
    val username: String,
    val email: String,
    val role: String
)

// 🏆 Liga
data class League(
    val id: Int? = null,
    val name: String,
    val description: String? = null
)

// 🗺️ Zona
data class Zone(
    val id: Int? = null,
    @SerializedName("league") val leagueId: Int,
    val name: String
)

// 🏟️ Estadio
data class Stadium(
    val id: Int? = null,
    @SerializedName("zone") val zoneId: Int,
    val name: String,
    val address: String? = null
)

// ⚾ Equipo
data class Team(
    val id: Int? = null,
    val name: String,
    @SerializedName("short_name") val shortName: String, // <-- agregado
    @SerializedName("league") val leagueId: Int
)

data class GameAssignment(
    val id: Int,
    @SerializedName("ampayer") val ampayerId: Int,
    @SerializedName("ampayer_name") val ampayerName: String,
    val status: String
)

/** Estado personalizado del umpire enviado por backend */
data class UmpireStatus(
    val status: String?,
    @SerializedName("assignment_id") val assignmentId: Int?
)

/** 🎮 Juego */
data class Game(
    val id: Int,
    @SerializedName("league") val leagueId: Int,
    @SerializedName("league_name") val leagueName: String,
    @SerializedName("zone") val zoneId: Int,
    @SerializedName("zone_name") val zoneName: String,
    @SerializedName("stadium") val stadiumId: Int,
    @SerializedName("stadium_name") val stadiumName: String,
    @SerializedName("local_team") val localTeamId: Int,
    @SerializedName("local_team_name") val localTeamName: String,
    @SerializedName("visitor_team") val visitorTeamId: Int,
    @SerializedName("visitor_team_name") val visitorTeamName: String,
    @SerializedName("ampayer_1") val ampayer1Id: Int?,
    @SerializedName("ampayer_1_name") val ampayer1Name: String?,
    @SerializedName("ampayer_2") val ampayer2Id: Int?,
    @SerializedName("ampayer_2_name") val ampayer2Name: String?,
    val date: String,
    val time: String?,
    val status: String,

    @SerializedName("umpire_status")
    val umpireStatus: UmpireStatus?,

    @SerializedName("assignments_status")
    val assignments_status: List<GameAssignment>
)

// Batch assignments
data class AssignmentItem(val gameId: Int, val ampayer1Id: Int?, val ampayer2Id: Int?)
data class AssignmentsRequest(val assignments: List<AssignmentItem>)
data class AssignmentsResponse(val success: Boolean, val message: String? = null)
data class StatusUpdateRequest(val status: String) // e.g., "confirmed", "rejected", "cancelled"

data class Notification(
    val id: Int,
    val message: String,
    @SerializedName("is_read") val isRead: Boolean,
    @SerializedName("created_at") val createdAt: String,
    @SerializedName("game") val gameId: Int? = null,
    @SerializedName("game_status") val gameStatus: String? = null
)
/** ------------------ API SERVICE ------------------ **/

interface ApiService {

    // 🔐 Autenticación
    @POST("token/") suspend fun login(@Body request: LoginRequest): LoginResponse
    @GET("users/me/") suspend fun getMe(@Header("Authorization") token: String): ApiUser

    // 🏆 LIGAS
    @GET("leagues/") suspend fun getLeagues(@Header("Authorization") token: String): List<League>
    @POST("leagues/") suspend fun createLeague(@Header("Authorization") token: String, @Body league: League): League
    @PUT("leagues/{id}/") suspend fun updateLeague(@Header("Authorization") token: String, @Path("id") id: Int, @Body league: League): League
    @DELETE("leagues/{id}/") suspend fun deleteLeague(@Header("Authorization") token: String, @Path("id") id: Int)

    // 🗺️ ZONAS
    @GET("zones/") suspend fun getZones(@Header("Authorization") token: String): List<Zone>
    @POST("zones/") suspend fun createZone(@Header("Authorization") token: String, @Body zone: Zone): Zone
    @PUT("zones/{id}/") suspend fun updateZone(@Header("Authorization") token: String, @Path("id") id: Int, @Body zone: Zone): Zone
    @DELETE("zones/{id}/") suspend fun deleteZone(@Header("Authorization") token: String, @Path("id") id: Int)

    // 🏟️ ESTADIOS
    @GET("stadiums/") suspend fun getStadiums(@Header("Authorization") token: String): List<Stadium>
    @POST("stadiums/") suspend fun createStadium(@Header("Authorization") token: String, @Body stadium: Stadium): Stadium
    @PUT("stadiums/{id}/") suspend fun updateStadium(@Header("Authorization") token: String, @Path("id") id: Int, @Body stadium: Stadium): Stadium
    @DELETE("stadiums/{id}/") suspend fun deleteStadium(@Header("Authorization") token: String, @Path("id") id: Int)

    // ⚾ EQUIPOS
    @GET("teams/") suspend fun getTeams(@Header("Authorization") token: String): List<Team>
    @POST("teams/") suspend fun createTeam(@Header("Authorization") token: String, @Body team: Team): Team
    @PUT("teams/{id}/") suspend fun updateTeam(@Header("Authorization") token: String, @Path("id") id: Int, @Body team: Team): Team
    @DELETE("teams/{id}/") suspend fun deleteTeam(@Header("Authorization") token: String, @Path("id") id: Int)

    // 🎮 JUEGOS
    @GET("games/") suspend fun getGames(@Header("Authorization") token: String): List<Game>
    @POST("games/") suspend fun createGame(@Header("Authorization") token: String, @Body game: Game): Game
    @PUT("games/{id}/") suspend fun updateGame(@Header("Authorization") token: String, @Path("id") id: Int, @Body game: Game): Game
    @DELETE("games/{id}/") suspend fun deleteGame(@Header("Authorization") token: String, @Path("id") id: Int)

    // 👤 AMPAYERS
    @GET("users/") suspend fun getAmpayers(@Header("Authorization") token: String, @Query("role") role: String = "ampayer"): List<UserDto>
    @POST("users/") suspend fun createAmpayer(@Header("Authorization") token: String, @Body newUser: UserDto)


    @PUT("users/{id}/")
    suspend fun updateAmpayer(
        @Header("Authorization") token: String,
        @Path("id") id: Int,
        @Body user: UserDto
    ): Response<UserDto>
    @DELETE("users/{id}/") suspend fun deleteAmpayer(@Header("Authorization") token: String, @Path("id") id: Int)



    @POST("users/register/") // ruta nueva para registro público
    suspend fun registerUser(@Body newUser: UserDto): UserDto


    // ✅ Admin crea Ampayer
    @POST("users/admin-create/")
    suspend fun createAmpayerByAdmin(
        @Header("Authorization") token: String,  // JWT del admin
        @Body user: UserRequest
    ): Response<UserResponse>

    // ✅ Registro normal (autoregistro)
    @POST("users/register/")
    suspend fun registerAmpayer(
        @Body user: UserRequest
    ): Response<UserResponse>




    // 📋 Juegos por ampayer
    @GET("games/ampayer/{ampayerId}/")
    suspend fun getGamesForAmpayer(
        @Header("Authorization") token: String,
        @Path("ampayerId") ampayerId: Int
    ): List<Game>


    // Filtrar juegos por liga y fecha
    @GET("games/")
    suspend fun getGamesByLeagueAndDate(
        @Header("Authorization") token: String,
        @Query("league_id") leagueId: Int,
        @Query("date") date: String
    ): List<Game>

    // Asignación batch de ampayers
    @POST("games/assignments/")
    suspend fun assignAmpayersBatch(
        @Header("Authorization") token: String,
        @Body body: AssignmentsRequest
    ): AssignmentsResponse



    // Confirmar o rechazar asignación
    @POST("games/{id}/confirm/")
    suspend fun confirmAssignment(
        @Header("Authorization") token: String,
        @Path("id") gameId: Int,
        @Body payload: StatusUpdateRequest
    ): Game

    @POST("games/{id}/reject/")
    suspend fun rejectAssignment(
        @Header("Authorization") token: String,
        @Path("id") gameId: Int,
        @Body payload: StatusUpdateRequest
    ): Game


    // Actualizar estado general de juego (cancelar)
    @PATCH("games/{id}/status/")
    suspend fun updateGameStatus(
        @Header("Authorization") token: String,
        @Path("id") gameId: Int,
        @Body payload: StatusUpdateRequest
    ): Game

    @GET("notifications/")
    suspend fun getNotifications(@Header("Authorization") token: String): List<Notification>

    @POST("notifications/{id}/read/")
    suspend fun markNotificationRead(
        @Header("Authorization") token: String,
        @Path("id") notificationId: Int
    ): Notification

}

/** ------------------ RETROFIT INSTANCE ------------------ **/

object RetrofitInstance {
    private const val BASE_URL = "http://10.0.2.2:8000/api/"
    private val logging = HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BODY }
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)    // ⬅ importante
        .readTimeout(30, TimeUnit.SECONDS)       // ⬅ importante
        .writeTimeout(30, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .addInterceptor(logging)
        .build()

    val api: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
