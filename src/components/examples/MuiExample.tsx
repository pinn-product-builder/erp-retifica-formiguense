/**
 * Exemplo de uso de Material UI no sistema
 * 
 * Este arquivo demonstra como usar componentes do Material UI
 * integrados com o sistema de design existente.
 */

import React from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Box,
  Grid,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';

export function MuiExample() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Exemplo de Componentes Material UI
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Card de exemplo */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Card do Material UI" />
            <CardContent>
              <Typography variant="body1" gutterBottom>
                Este é um exemplo de Card do Material UI integrado ao sistema.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button variant="contained" startIcon={<AddIcon />}>
                  Adicionar
                </Button>
                <Button variant="outlined" startIcon={<EditIcon />}>
                  Editar
                </Button>
                <Button variant="text" color="error" startIcon={<DeleteIcon />}>
                  Excluir
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Formulário de exemplo */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Formulário Material UI" />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Nome"
                  variant="outlined"
                  fullWidth
                />
                <TextField
                  label="Email"
                  type="email"
                  variant="outlined"
                  fullWidth
                />
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label="Sucesso" color="success" />
                  <Chip label="Aviso" color="warning" />
                  <Chip label="Erro" color="error" />
                  <Chip label="Info" color="info" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Alertas e outros */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Alertas e Indicadores" />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Alert severity="success">
                  Operação realizada com sucesso!
                </Alert>
                <Alert severity="warning">
                  Atenção: Esta ação requer confirmação.
                </Alert>
                <Alert severity="error">
                  Erro ao processar a solicitação.
                </Alert>
                <Alert severity="info">
                  Informação: O sistema está funcionando normalmente.
                </Alert>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <CircularProgress size={24} />
                  <Typography>Carregando...</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

