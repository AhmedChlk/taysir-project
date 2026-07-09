/**
 * Hook de démarrage serveur (Next.js instrumentation).
 *
 * Filet de sécurité fuseau horaire : l'application vise les écoles algériennes
 * (UTC+1) et tous les calculs de dates s'appuient sur l'heure locale du process.
 * En production le fuseau est fixé par le conteneur (Dockerfile/compose `TZ`) ;
 * ici on garantit la même valeur par défaut en dev/local si `TZ` n'est pas déjà
 * défini, pour que le comportement soit identique partout.
 */
export function register() {
	if (!process.env.TZ) {
		process.env.TZ = "Africa/Algiers";
	}
}
