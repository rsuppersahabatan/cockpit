/*
 * This file is part of Cockpit.
 *
 * Copyright (C) 2013 Red Hat, Inc.
 *
 * Cockpit is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * Cockpit is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Cockpit; If not, see <https://www.gnu.org/licenses/>.
 */

#ifndef __COCKPIT_CREDS_H__
#define __COCKPIT_CREDS_H__

#include <glib.h>
#include <glib-object.h>

#include <json-glib/json-glib.h>

G_BEGIN_DECLS

typedef struct _CockpitCreds       CockpitCreds;

#define COCKPIT_CRED_USER         "user"
#define COCKPIT_CRED_PASSWORD     "password"
#define COCKPIT_CRED_RHOST        "rhost"
#define COCKPIT_CRED_CSRF_TOKEN   "csrf-token"
#define COCKPIT_CRED_SUPERUSER    "superuser"

#define         COCKPIT_TYPE_CREDS           (cockpit_creds_get_type ())

GType           cockpit_creds_get_type       (void) G_GNUC_CONST;

CockpitCreds *  cockpit_creds_new            (const gchar *application,
                                              ...) G_GNUC_NULL_TERMINATED;

CockpitCreds *  cockpit_creds_ref            (CockpitCreds *creds);

void            cockpit_creds_unref          (gpointer creds);

void            cockpit_creds_poison         (CockpitCreds *creds);

const gchar *   cockpit_creds_get_user       (CockpitCreds *creds);

void            cockpit_creds_set_user       (CockpitCreds *creds,
                                              const gchar *user);

GBytes *        cockpit_creds_get_password   (CockpitCreds *creds);

void            cockpit_creds_set_password   (CockpitCreds *creds,
                                              GBytes *password);

const gchar *   cockpit_creds_get_rhost      (CockpitCreds *creds);

const gchar *   cockpit_creds_get_csrf_token (CockpitCreds *creds);

const gchar *   cockpit_creds_get_superuser  (CockpitCreds *creds);

const gchar *   cockpit_creds_get_application            (CockpitCreds *creds);

void            cockpit_creds_set_login_data             (CockpitCreds *creds,
                                                          JsonObject *login_data);

JsonObject *    cockpit_creds_get_login_data             (CockpitCreds *creds);

JsonObject *    cockpit_creds_to_json                    (CockpitCreds *creds);

G_DEFINE_AUTOPTR_CLEANUP_FUNC(CockpitCreds, cockpit_creds_unref)

G_END_DECLS

#endif
