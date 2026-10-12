export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      bloqueo_cancha: {
        Row: {
          cancha_id: string
          creado_por: string | null
          created_at: string
          desde: string
          hasta: string
          id: string
          motivo: string | null
        }
        Insert: {
          cancha_id: string
          creado_por?: string | null
          created_at?: string
          desde: string
          hasta: string
          id?: string
          motivo?: string | null
        }
        Update: {
          cancha_id?: string
          creado_por?: string | null
          created_at?: string
          desde?: string
          hasta?: string
          id?: string
          motivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bloqueo_cancha_cancha_id_fkey"
            columns: ["cancha_id"]
            isOneToOne: false
            referencedRelation: "cancha"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bloqueo_cancha_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "empleado"
            referencedColumns: ["id"]
          },
        ]
      }
      cancha: {
        Row: {
          activa: boolean
          capacidad: number
          id: string
          numero: number
          precio_base: number
          sede_id: string
        }
        Insert: {
          activa?: boolean
          capacidad: number
          id?: string
          numero: number
          precio_base: number
          sede_id: string
        }
        Update: {
          activa?: boolean
          capacidad?: number
          id?: string
          numero?: number
          precio_base?: number
          sede_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cancha_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sede"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion: {
        Row: {
          actualizado_at: string
          actualizado_por: string | null
          dias_anticipacion_max: number
          dias_retencion_reservas: number
          factor_recargo: number
          hora_primer_turno: string
          hora_recargo_desde: string
          hora_ultimo_turno: string
          horas_para_confirmar: number
          id: boolean
          inasistencias_aviso: number
          inasistencias_suspension: number
          max_reservas_activas: number
          meses_suspension: number
          monto_sena: number
        }
        Insert: {
          actualizado_at?: string
          actualizado_por?: string | null
          dias_anticipacion_max?: number
          dias_retencion_reservas?: number
          factor_recargo?: number
          hora_primer_turno?: string
          hora_recargo_desde?: string
          hora_ultimo_turno?: string
          horas_para_confirmar?: number
          id?: boolean
          inasistencias_aviso?: number
          inasistencias_suspension?: number
          max_reservas_activas?: number
          meses_suspension?: number
          monto_sena?: number
        }
        Update: {
          actualizado_at?: string
          actualizado_por?: string | null
          dias_anticipacion_max?: number
          dias_retencion_reservas?: number
          factor_recargo?: number
          hora_primer_turno?: string
          hora_recargo_desde?: string
          hora_ultimo_turno?: string
          horas_para_confirmar?: number
          id?: boolean
          inasistencias_aviso?: number
          inasistencias_suspension?: number
          max_reservas_activas?: number
          meses_suspension?: number
          monto_sena?: number
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_actualizado_por_fkey"
            columns: ["actualizado_por"]
            isOneToOne: false
            referencedRelation: "empleado"
            referencedColumns: ["id"]
          },
        ]
      }
      empleado: {
        Row: {
          activo: boolean
          id: string
          rol: string
          sede_id: string
          usuario_id: string
        }
        Insert: {
          activo?: boolean
          id?: string
          rol?: string
          sede_id: string
          usuario_id: string
        }
        Update: {
          activo?: boolean
          id?: string
          rol?: string
          sede_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empleado_sede_id_fkey"
            columns: ["sede_id"]
            isOneToOne: false
            referencedRelation: "sede"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empleado_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      pago: {
        Row: {
          comprobante_email: string | null
          comprobante_enviado: boolean
          created_at: string
          estado: string
          fecha_pago: string | null
          id: string
          monto: number
          mp_payment_id: string | null
          reserva_id: string
        }
        Insert: {
          comprobante_email?: string | null
          comprobante_enviado?: boolean
          created_at?: string
          estado: string
          fecha_pago?: string | null
          id?: string
          monto: number
          mp_payment_id?: string | null
          reserva_id: string
        }
        Update: {
          comprobante_email?: string | null
          comprobante_enviado?: boolean
          created_at?: string
          estado?: string
          fecha_pago?: string | null
          id?: string
          monto?: number
          mp_payment_id?: string | null
          reserva_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pago_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: true
            referencedRelation: "reserva"
            referencedColumns: ["id"]
          },
        ]
      }
      reserva: {
        Row: {
          cancelada_at: string | null
          cancelada_por: string | null
          cancha_id: string
          created_at: string
          estado: string
          fecha: string
          hora_inicio: string
          id: string
          llegada_validada_at: string | null
          llegada_validada_por: string | null
          monto_sena: number
          no_show_at: string | null
          no_show_por: string | null
          precio_total: number
          sena_devuelta: boolean
          usuario_id: string
        }
        Insert: {
          cancelada_at?: string | null
          cancelada_por?: string | null
          cancha_id: string
          created_at?: string
          estado?: string
          fecha: string
          hora_inicio: string
          id?: string
          llegada_validada_at?: string | null
          llegada_validada_por?: string | null
          monto_sena?: number
          no_show_at?: string | null
          no_show_por?: string | null
          precio_total: number
          sena_devuelta?: boolean
          usuario_id: string
        }
        Update: {
          cancelada_at?: string | null
          cancelada_por?: string | null
          cancha_id?: string
          created_at?: string
          estado?: string
          fecha?: string
          hora_inicio?: string
          id?: string
          llegada_validada_at?: string | null
          llegada_validada_por?: string | null
          monto_sena?: number
          no_show_at?: string | null
          no_show_por?: string | null
          precio_total?: number
          sena_devuelta?: boolean
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reserva_cancelada_por_fkey"
            columns: ["cancelada_por"]
            isOneToOne: false
            referencedRelation: "empleado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reserva_cancha_id_fkey"
            columns: ["cancha_id"]
            isOneToOne: false
            referencedRelation: "cancha"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reserva_llegada_validada_por_fkey"
            columns: ["llegada_validada_por"]
            isOneToOne: false
            referencedRelation: "empleado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reserva_no_show_por_fkey"
            columns: ["no_show_por"]
            isOneToOne: false
            referencedRelation: "empleado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reserva_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      sede: {
        Row: {
          created_at: string
          direccion: string | null
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          direccion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          direccion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      usuario: {
        Row: {
          created_at: string
          id: string
          inasistencias: number
          nombre: string
          suspendido_hasta: string | null
          suspensiones: number
          telefono: string | null
          vetado: boolean
        }
        Insert: {
          created_at?: string
          id: string
          inasistencias?: number
          nombre: string
          suspendido_hasta?: string | null
          suspensiones?: number
          telefono?: string | null
          vetado?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          inasistencias?: number
          nombre?: string
          suspendido_hasta?: string | null
          suspensiones?: number
          telefono?: string | null
          vetado?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      actualizar_cancha: {
        Args: {
          p_activa?: boolean
          p_cancha_id: string
          p_precio_base?: number
        }
        Returns: {
          activa: boolean
          capacidad: number
          id: string
          numero: number
          precio_base: number
          sede_id: string
        }
        SetofOptions: {
          from: "*"
          to: "cancha"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      actualizar_canchas_sede: {
        Args: { p_activa: boolean; p_sede_id: string }
        Returns: number
      }
      actualizar_configuracion: {
        Args: {
          p_dias_anticipacion_max?: number
          p_factor_recargo?: number
          p_hora_primer_turno?: string
          p_hora_recargo_desde?: string
          p_hora_ultimo_turno?: string
          p_max_reservas_activas?: number
          p_monto_sena?: number
        }
        Returns: {
          actualizado_at: string
          actualizado_por: string | null
          dias_anticipacion_max: number
          dias_retencion_reservas: number
          factor_recargo: number
          hora_primer_turno: string
          hora_recargo_desde: string
          hora_ultimo_turno: string
          horas_para_confirmar: number
          id: boolean
          inasistencias_aviso: number
          inasistencias_suspension: number
          max_reservas_activas: number
          meses_suspension: number
          monto_sena: number
        }
        SetofOptions: {
          from: "*"
          to: "configuracion"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ahora_local: { Args: never; Returns: string }
      bloquear_cancha: {
        Args: {
          p_cancha_id: string
          p_desde: string
          p_forzar?: boolean
          p_hasta?: string
          p_motivo?: string
        }
        Returns: {
          cancha_id: string
          creado_por: string | null
          created_at: string
          desde: string
          hasta: string
          id: string
          motivo: string | null
        }
        SetofOptions: {
          from: "*"
          to: "bloqueo_cancha"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      borrar_reservas_vencidas: { Args: never; Returns: number }
      cancelar_reserva: {
        Args: { p_reserva_id: string; p_sena_devuelta: boolean }
        Returns: undefined
      }
      confirmar_reserva: { Args: { p_reserva_id: string }; Returns: undefined }
      crear_reserva: {
        Args: { p_cancha_id: string; p_fecha: string; p_hora_inicio: string }
        Returns: {
          cancelada_at: string | null
          cancelada_por: string | null
          cancha_id: string
          created_at: string
          estado: string
          fecha: string
          hora_inicio: string
          id: string
          llegada_validada_at: string | null
          llegada_validada_por: string | null
          monto_sena: number
          no_show_at: string | null
          no_show_por: string | null
          precio_total: number
          sena_devuelta: boolean
          usuario_id: string
        }
        SetofOptions: {
          from: "*"
          to: "reserva"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      desbloquear_cancha: { Args: { p_bloqueo_id: string }; Returns: undefined }
      dias_anticipacion_max: { Args: never; Returns: number }
      disponibilidad: {
        Args: { p_cancha_id: string; p_fecha: string }
        Returns: {
          hora_inicio: string
          ocupado: boolean
          precio: number
        }[]
      }
      empleado_a_cargo: { Args: { p_reserva_id: string }; Returns: string }
      es_admin: { Args: never; Returns: boolean }
      es_empleado_de_sede: { Args: { p_sede_id: string }; Returns: boolean }
      es_turno_valido: { Args: { p_hora: string }; Returns: boolean }
      esta_bloqueada: {
        Args: { p_cancha_id: string; p_fecha: string }
        Returns: boolean
      }
      estadisticas_del_predio: { Args: { p_sede_id: string }; Returns: Json }
      factor_recargo: { Args: never; Returns: number }
      hora_primer_turno: { Args: never; Returns: string }
      hora_recargo_desde: { Args: never; Returns: string }
      hora_ultimo_turno: { Args: never; Returns: string }
      levantar_sancion: { Args: { p_usuario_id: string }; Returns: undefined }
      liberar_reservas_sin_confirmar: { Args: never; Returns: number }
      marcar_inasistencia: {
        Args: { p_reserva_id: string }
        Returns: undefined
      }
      max_reservas_activas: { Args: never; Returns: number }
      mi_empleado: {
        Args: never
        Returns: {
          empleado_id: string
          rol: string
          sede_id: string
        }[]
      }
      monto_sena_default: { Args: never; Returns: number }
      ocupacion_del_dia: {
        Args: { p_fecha: string; p_sede_id: string }
        Returns: {
          cancha_id: string
          turnos_libres: number
          turnos_reservados: number
          turnos_totales: number
        }[]
      }
      precio_turno: {
        Args: { p_hora: string; p_precio_base: number }
        Returns: number
      }
      sede_de_cancha: { Args: { p_cancha_id: string }; Returns: string }
      validar_llegada: { Args: { p_reserva_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
