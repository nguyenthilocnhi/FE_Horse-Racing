/**
 * services/index.js
 * Barrel export — import tất cả services từ một chỗ.
 *
 * Ví dụ sử dụng:
 *   import { login, register } from '../services'
 *   import { createTournament, getTournamentRankings } from '../services'
 */

export * as auth         from './authService'
export * as admin        from './adminService'
export * as owner        from './ownerService'
export * as jockey       from './jockeyService'
export * as horse        from './horseService'
export * as raceTrack    from './raceTrackService'
export * as referee      from './refereeService'
export * as tournament   from './tournamentService'
export * as race         from './raceService'
export * as prediction   from './predictionService'
export * as spectator    from './spectatorService'
export * as system       from './systemService'
