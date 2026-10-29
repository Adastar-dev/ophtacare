-- OphtaCare : schéma complet et données de démonstration de base
-- Généré depuis les migrations et seeders Laravel (php artisan migrate --seed).
-- Comptes de démonstration : voir README.md (mot de passe : password).

CREATE DATABASE IF NOT EXISTS `ophtalmo_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ophtalmo_db`;

/*M!999999\- enable the sandbox mode */ 

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `model_type` varchar(255) DEFAULT NULL,
  `model_id` bigint(20) unsigned DEFAULT NULL,
  `anciennes_valeurs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`anciennes_valeurs`)),
  `nouvelles_valeurs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`nouvelles_valeurs`)),
  `ip` varchar(255) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `clinique_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `activity_logs_user_id_foreign` (`user_id`),
  KEY `activity_logs_clinique_id_foreign` (`clinique_id`),
  CONSTRAINT `activity_logs_clinique_id_foreign` FOREIGN KEY (`clinique_id`) REFERENCES `cliniques` (`id`) ON DELETE SET NULL,
  CONSTRAINT `activity_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `cliniques`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cliniques` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `adresse` varchar(255) DEFAULT NULL,
  `telephone` varchar(255) DEFAULT NULL,
  `statut` enum('actif','inactif') NOT NULL DEFAULT 'actif',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `cliniques` WRITE;
/*!40000 ALTER TABLE `cliniques` DISABLE KEYS */;
INSERT INTO `cliniques` VALUES
(1,'Centre Ophtalmologique de Dakar (ESMT-Vision)','Avenue Cheikh Anta Diop, Dakar','+221338690000','actif','2026-10-27 20:07:33','2026-10-27 20:07:33'),
(2,'Clinique de la Réfraction - Saint-Louis','Quartier Sor, Saint-Louis','+221339610000','actif','2026-10-27 20:07:33','2026-10-27 20:07:33');
/*!40000 ALTER TABLE `cliniques` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `consultations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultations` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `rendez_vous_id` bigint(20) unsigned DEFAULT NULL,
  `patient_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `vl_od_sans_correction` varchar(255) DEFAULT NULL,
  `vl_od_avec_correction` varchar(255) DEFAULT NULL,
  `vl_og_sans_correction` varchar(255) DEFAULT NULL,
  `vl_og_avec_correction` varchar(255) DEFAULT NULL,
  `vp_od_sans_correction` varchar(255) DEFAULT NULL,
  `vp_od_avec_correction` varchar(255) DEFAULT NULL,
  `vp_og_sans_correction` varchar(255) DEFAULT NULL,
  `vp_og_avec_correction` varchar(255) DEFAULT NULL,
  `ref_od_sphere` decimal(5,2) DEFAULT NULL,
  `ref_od_cylindre` decimal(5,2) DEFAULT NULL,
  `ref_od_axe` int(11) DEFAULT NULL,
  `ref_og_sphere` decimal(5,2) DEFAULT NULL,
  `ref_og_cylindre` decimal(5,2) DEFAULT NULL,
  `ref_og_axe` int(11) DEFAULT NULL,
  `tonus_od` int(11) DEFAULT NULL,
  `tonus_og` int(11) DEFAULT NULL,
  `observations_cliniques` text DEFAULT NULL,
  `diagnostic` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `consultations_rendez_vous_id_foreign` (`rendez_vous_id`),
  KEY `consultations_patient_id_foreign` (`patient_id`),
  KEY `consultations_user_id_foreign` (`user_id`),
  CONSTRAINT `consultations_patient_id_foreign` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `consultations_rendez_vous_id_foreign` FOREIGN KEY (`rendez_vous_id`) REFERENCES `rendez_vous` (`id`) ON DELETE CASCADE,
  CONSTRAINT `consultations_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `consultations` WRITE;
/*!40000 ALTER TABLE `consultations` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultations` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `indisponibilites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `indisponibilites` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `clinique_id` bigint(20) unsigned NOT NULL,
  `date` date NOT NULL,
  `heure_debut` tinyint(3) unsigned NOT NULL DEFAULT 8,
  `heure_fin` tinyint(3) unsigned NOT NULL DEFAULT 18,
  `motif` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `indisponibilites_user_id_foreign` (`user_id`),
  KEY `indisponibilites_clinique_id_date_index` (`clinique_id`,`date`),
  CONSTRAINT `indisponibilites_clinique_id_foreign` FOREIGN KEY (`clinique_id`) REFERENCES `cliniques` (`id`) ON DELETE CASCADE,
  CONSTRAINT `indisponibilites_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `indisponibilites` WRITE;
/*!40000 ALTER TABLE `indisponibilites` DISABLE KEYS */;
/*!40000 ALTER TABLE `indisponibilites` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES
(1,'0001_01_01_000000_create_cliniques_table',1),
(2,'0001_01_01_000000_create_users_table',1),
(3,'0001_01_01_000001_create_cache_table',1),
(4,'0001_01_01_000002_create_jobs_table',1),
(5,'2026_06_15_000001_create_patients_table',1),
(6,'2026_06_15_000002_create_rendez_vous_table',1),
(7,'2026_06_15_000003_create_consultations_table',1),
(8,'2026_06_15_000004_create_prescriptions_table',1),
(9,'2026_06_15_000005_create_paiements_table',1),
(10,'2026_06_15_000006_create_rappels_table',1),
(11,'2026_06_15_000007_create_transaction_logs_table',1),
(12,'2026_06_15_000008_create_activity_logs_table',1),
(13,'2026_06_15_004021_create_personal_access_tokens_table',1),
(14,'2026_06_19_000001_add_patient_role_and_insurance',1),
(15,'2026_06_19_000002_add_prise_en_charge_details_to_rendez_vous',1),
(16,'2026_06_21_000001_make_rendez_vous_id_nullable_on_consultations',1),
(17,'2026_06_21_000002_create_indisponibilites_table',1),
(18,'2026_06_22_000001_align_prescriptions_and_transaction_logs',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `paiements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `paiements` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `rendez_vous_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `montant` decimal(10,2) NOT NULL,
  `type_paiement` enum('acompte','solde','total') NOT NULL,
  `mode_paiement` enum('liquide','wave','orange_money') NOT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `reference_operateur` varchar(255) DEFAULT NULL,
  `statut` enum('en_attente','reussi','echoue','rembourse') NOT NULL DEFAULT 'en_attente',
  `devise` varchar(255) NOT NULL DEFAULT 'XOF',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `expire_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `paiements_transaction_id_unique` (`transaction_id`),
  KEY `paiements_rendez_vous_id_foreign` (`rendez_vous_id`),
  KEY `paiements_user_id_foreign` (`user_id`),
  CONSTRAINT `paiements_rendez_vous_id_foreign` FOREIGN KEY (`rendez_vous_id`) REFERENCES `rendez_vous` (`id`) ON DELETE CASCADE,
  CONSTRAINT `paiements_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `paiements` WRITE;
/*!40000 ALTER TABLE `paiements` DISABLE KEYS */;
/*!40000 ALTER TABLE `paiements` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `patients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `patients` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code_patient` varchar(255) NOT NULL,
  `nom` varchar(255) NOT NULL,
  `prenom` varchar(255) NOT NULL,
  `date_naissance` date NOT NULL,
  `genre` enum('M','F') NOT NULL,
  `telephone` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `antecedents_medicaux` text DEFAULT NULL,
  `allergies` text DEFAULT NULL,
  `assureur` varchar(255) DEFAULT NULL,
  `numero_assurance` varchar(255) DEFAULT NULL,
  `taux_couverture` tinyint(3) unsigned DEFAULT NULL,
  `clinique_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `patients_code_patient_unique` (`code_patient`),
  UNIQUE KEY `patients_telephone_unique` (`telephone`),
  UNIQUE KEY `patients_email_unique` (`email`),
  KEY `patients_clinique_id_foreign` (`clinique_id`),
  CONSTRAINT `patients_clinique_id_foreign` FOREIGN KEY (`clinique_id`) REFERENCES `cliniques` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `patients` WRITE;
/*!40000 ALTER TABLE `patients` DISABLE KEYS */;
INSERT INTO `patients` VALUES
(1,'PAT-2026-0001','Diallo','Mariama','1985-03-12','F','771234001','mariama.diallo@gmail.com','Diabète de type 2','Pénicilline',NULL,NULL,NULL,1,'2026-10-27 20:07:34','2026-10-27 20:07:34'),
(2,'PAT-2026-0002','Ndiaye','Ousmane','1978-07-22','M','771234002','ousmane.ndiaye@gmail.com',NULL,NULL,NULL,NULL,NULL,1,'2026-10-27 20:07:34','2026-10-27 20:07:34'),
(3,'PAT-2026-0003','Sow','Aissatou','1992-11-05','F','771234003',NULL,'Diabète de type 2',NULL,NULL,NULL,NULL,1,'2026-10-27 20:07:34','2026-10-27 20:07:34'),
(4,'PAT-2026-0004','Ba','Mamadou','1965-01-30','M','771234004','mamadou.ba@outlook.com',NULL,'Pénicilline',NULL,NULL,NULL,1,'2026-10-27 20:07:34','2026-10-27 20:07:34'),
(5,'PAT-2026-0005','Fall','Rokhaya','2001-09-18','F','771234005',NULL,'Diabète de type 2',NULL,NULL,NULL,NULL,1,'2026-10-27 20:07:34','2026-10-27 20:07:34'),
(6,'PAT-2026-0006','Gueye','Pape','1970-04-14','M','771234006','pape.gueye@gmail.com',NULL,NULL,NULL,NULL,NULL,1,'2026-10-27 20:07:34','2026-10-27 20:07:34'),
(7,'PAT-2026-0007','Toure','Aminata','1988-06-25','F','771234007',NULL,'Diabète de type 2','Pénicilline',NULL,NULL,NULL,1,'2026-10-27 20:07:34','2026-10-27 20:07:34'),
(8,'PAT-2026-0008','Mbaye','Serigne','1955-12-10','M','771234008','serigne.mbaye@hotmail.com',NULL,NULL,NULL,NULL,NULL,1,'2026-10-27 20:07:34','2026-10-27 20:07:34');
/*!40000 ALTER TABLE `patients` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `prescriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `prescriptions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `consultation_id` bigint(20) unsigned NOT NULL,
  `contenu_ordonnance` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`contenu_ordonnance`)),
  `qr_token` varchar(255) DEFAULT NULL,
  `qr_token_expire_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `prescriptions_qr_token_unique` (`qr_token`),
  KEY `prescriptions_consultation_id_foreign` (`consultation_id`),
  CONSTRAINT `prescriptions_consultation_id_foreign` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `prescriptions` WRITE;
/*!40000 ALTER TABLE `prescriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `prescriptions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `rappels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `rappels` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` bigint(20) unsigned NOT NULL,
  `type_rappel` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `date_planifiee` date NOT NULL,
  `statut` enum('en_attente','envoye','echoue') NOT NULL DEFAULT 'en_attente',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `rappels_patient_id_foreign` (`patient_id`),
  CONSTRAINT `rappels_patient_id_foreign` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `rappels` WRITE;
/*!40000 ALTER TABLE `rappels` DISABLE KEYS */;
/*!40000 ALTER TABLE `rappels` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `rendez_vous`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `rendez_vous` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `patient_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `clinique_id` bigint(20) unsigned NOT NULL,
  `date_heure_rdv` datetime NOT NULL,
  `statut_rdv` enum('en_attente_paiement','confirme','annule','honore','expire') NOT NULL DEFAULT 'en_attente_paiement',
  `statut_paiement` enum('non_paye','acompte_verse','solde','pris_en_charge') NOT NULL DEFAULT 'non_paye',
  `prise_en_charge_assurance` tinyint(1) NOT NULL DEFAULT 0,
  `taux_prise_en_charge` tinyint(3) unsigned DEFAULT NULL,
  `montant_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `montant_assurance` decimal(10,2) NOT NULL DEFAULT 0.00,
  `montant_patient` decimal(10,2) NOT NULL DEFAULT 0.00,
  `montant_acompte` decimal(10,2) NOT NULL DEFAULT 0.00,
  `motif` text DEFAULT NULL,
  `document_prise_en_charge` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `rendez_vous_patient_id_foreign` (`patient_id`),
  KEY `rendez_vous_user_id_foreign` (`user_id`),
  KEY `rendez_vous_clinique_id_foreign` (`clinique_id`),
  CONSTRAINT `rendez_vous_clinique_id_foreign` FOREIGN KEY (`clinique_id`) REFERENCES `cliniques` (`id`) ON DELETE CASCADE,
  CONSTRAINT `rendez_vous_patient_id_foreign` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `rendez_vous_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `rendez_vous` WRITE;
/*!40000 ALTER TABLE `rendez_vous` DISABLE KEYS */;
INSERT INTO `rendez_vous` VALUES
(1,1,3,1,'2026-10-21 09:00:34','confirme','solde',0,NULL,15000.00,0.00,0.00,0.00,'Bilan visuel annuel',NULL,'2026-10-27 20:07:34','2026-10-27 20:07:34'),
(2,2,3,1,'2026-10-24 10:00:34','confirme','acompte_verse',0,NULL,15000.00,0.00,0.00,0.00,'Contrôle myopie',NULL,'2026-10-27 20:07:34','2026-10-27 20:07:34'),
(3,3,3,1,'2026-10-27 11:00:34','honore','solde',0,NULL,15000.00,0.00,0.00,0.00,'Gêne visuelle / Flou',NULL,'2026-10-27 20:07:34','2026-10-27 20:07:34'),
(4,4,3,1,'2026-10-30 12:00:34','honore','non_paye',0,NULL,15000.00,0.00,0.00,0.00,'Consultation presbytie',NULL,'2026-10-27 20:07:34','2026-10-27 20:07:34'),
(5,5,3,1,'2026-11-02 13:00:34','en_attente_paiement','non_paye',0,NULL,15000.00,0.00,0.00,0.00,'Suivi post-opératoire',NULL,'2026-10-27 20:07:34','2026-10-27 20:07:34'),
(6,6,3,1,'2026-11-05 14:00:34','confirme','solde',0,NULL,15000.00,0.00,0.00,0.00,'Contrôle tension oculaire',NULL,'2026-10-27 20:07:34','2026-10-27 20:07:34');
/*!40000 ALTER TABLE `rendez_vous` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `transaction_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction_logs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `paiement_id` bigint(20) unsigned DEFAULT NULL,
  `rendez_vous_id` bigint(20) unsigned DEFAULT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `reference` varchar(255) NOT NULL,
  `type_evenement` enum('initiation_paiement','callback_recu','paiement_valide','paiement_echoue','remboursement_initie','remboursement_valide','expiration_lien') NOT NULL,
  `operateur` enum('liquide','wave','orange_money','system') NOT NULL DEFAULT 'system',
  `montant` decimal(10,2) DEFAULT NULL,
  `devise` varchar(255) NOT NULL DEFAULT 'XOF',
  `payload_requete` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload_requete`)),
  `payload_reponse` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload_reponse`)),
  `http_status` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `ip` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_logs_reference_unique` (`reference`),
  KEY `transaction_logs_paiement_id_foreign` (`paiement_id`),
  KEY `transaction_logs_rendez_vous_id_foreign` (`rendez_vous_id`),
  KEY `transaction_logs_user_id_foreign` (`user_id`),
  CONSTRAINT `transaction_logs_paiement_id_foreign` FOREIGN KEY (`paiement_id`) REFERENCES `paiements` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transaction_logs_rendez_vous_id_foreign` FOREIGN KEY (`rendez_vous_id`) REFERENCES `rendez_vous` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transaction_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `transaction_logs` WRITE;
/*!40000 ALTER TABLE `transaction_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `transaction_logs` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('super_admin','admin_entite','medecin','secretaire','caissier','patient') NOT NULL,
  `clinique_id` bigint(20) unsigned DEFAULT NULL,
  `patient_id` bigint(20) unsigned DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_clinique_id_foreign` (`clinique_id`),
  KEY `users_patient_id_foreign` (`patient_id`),
  CONSTRAINT `users_clinique_id_foreign` FOREIGN KEY (`clinique_id`) REFERENCES `cliniques` (`id`) ON DELETE CASCADE,
  CONSTRAINT `users_patient_id_foreign` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'Mouhammad Ndiaye','superadmin@ophtalmo.sn',NULL,'$2y$12$lHkdDtwV7ACO7wecbM.NKO23y7Ofzl4iWNZFBFTEPOeMn3BOy8D/W','super_admin',NULL,NULL,1,NULL,'2026-10-27 20:07:33','2026-10-27 20:07:33'),
(2,'Amadou Diallo','admin.dakar@ophtalmo.sn',NULL,'$2y$12$IBXx4eBQIzEOa317xJzHy.F8UaVnGCkz8i3/IhhDCz50VYTiGEZbC','admin_entite',1,NULL,1,NULL,'2026-10-27 20:07:33','2026-10-27 20:07:33'),
(3,'Dr. Fatou Sow','dr.sow@ophtalmo.sn',NULL,'$2y$12$o0j7zJ0f/.sdIJGzOHt/keUwqXOS4SY5h3r97M1vVcQtnt27pFe62','medecin',1,NULL,1,NULL,'2026-10-27 20:07:33','2026-10-27 20:07:33'),
(4,'Aicha Diop','secretaire.dakar@ophtalmo.sn',NULL,'$2y$12$xUBvUJmqdrSsXuNJCqppqO9hXeHTZ4j0GcQLuNiFmt0GHujgRNq9C','secretaire',1,NULL,1,NULL,'2026-10-27 20:07:33','2026-10-27 20:07:33'),
(5,'Ibrahima Ba','caisse.dakar@ophtalmo.sn',NULL,'$2y$12$Mqu5EzLsMoztgR00xor7uuT2DluC7AwJxm9FtgEYooHAx9HbWEWxG','caissier',1,NULL,1,NULL,'2026-10-27 20:07:34','2026-10-27 20:07:34');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

/*M!999999\- enable the sandbox mode */ 

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) unsigned NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL,
  `reserved_at` int(10) unsigned DEFAULT NULL,
  `available_at` int(10) unsigned NOT NULL,
  `created_at` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

