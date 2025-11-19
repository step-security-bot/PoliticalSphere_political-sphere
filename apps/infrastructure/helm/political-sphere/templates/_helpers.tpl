{{/*
Expand the name of the chart.
*/}}
{{- define "political-sphere.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "political-sphere.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "political-sphere.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "political-sphere.labels" -}}
helm.sh/chart: {{ include "political-sphere.chart" . }}
{{ include "political-sphere.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "political-sphere.selectorLabels" -}}
app.kubernetes.io/name: {{ include "political-sphere.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "political-sphere.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "political-sphere.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
API service account name
*/}}
{{- define "political-sphere.api.serviceAccountName" -}}
{{- if .Values.serviceAccounts.api.create }}
{{- default "api-service-account" .Values.serviceAccounts.api.name }}
{{- else }}
{{- default "default" .Values.serviceAccounts.api.name }}
{{- end }}
{{- end }}

{{/*
Game server service account name
*/}}
{{- define "political-sphere.gameServer.serviceAccountName" -}}
{{- if .Values.serviceAccounts.gameServer.create }}
{{- default "game-server-service-account" .Values.serviceAccounts.gameServer.name }}
{{- else }}
{{- default "default" .Values.serviceAccounts.gameServer.name }}
{{- end }}
{{- end }}

{{/*
Image pull policy
*/}}
{{- define "political-sphere.imagePullPolicy" -}}
{{- .Values.global.imagePullPolicy | default "IfNotPresent" }}
{{- end }}

{{/*
API image
*/}}
{{- define "political-sphere.api.image" -}}
{{- $registry := .Values.global.imageRegistry | default "" }}
{{- $repository := .Values.api.image.repository }}
{{- $tag := .Values.api.image.tag | default .Chart.AppVersion }}
{{- if $registry }}
{{- printf "%s/%s:%s" $registry $repository $tag }}
{{- else }}
{{- printf "%s:%s" $repository $tag }}
{{- end }}
{{- end }}

{{/*
Web image
*/}}
{{- define "political-sphere.web.image" -}}
{{- $registry := .Values.global.imageRegistry | default "" }}
{{- $repository := .Values.web.image.repository }}
{{- $tag := .Values.web.image.tag | default .Chart.AppVersion }}
{{- if $registry }}
{{- printf "%s/%s:%s" $registry $repository $tag }}
{{- else }}
{{- printf "%s:%s" $repository $tag }}
{{- end }}
{{- end }}

{{/*
Game server image
*/}}
{{- define "political-sphere.gameServer.image" -}}
{{- $registry := .Values.global.imageRegistry | default "" }}
{{- $repository := .Values.gameServer.image.repository }}
{{- $tag := .Values.gameServer.image.tag | default .Chart.AppVersion }}
{{- if $registry }}
{{- printf "%s/%s:%s" $registry $repository $tag }}
{{- else }}
{{- printf "%s:%s" $repository $tag }}
{{- end }}
{{- end }}