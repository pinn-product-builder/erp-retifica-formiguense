import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Clock, Trophy, DollarSign, Plus, Calendar, UserCheck } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';

const TIME_STATUS_COLORS = {
  present: 'bg-green-500/20 text-green-700',
  absent: 'bg-red-500/20 text-red-700',
  vacation: 'bg-blue-500/20 text-blue-700',
  sick: 'bg-yellow-500/20 text-yellow-700',
};

export default function GestaoFuncionarios() {
  const { 
    employees, 
    timeTracking, 
    commissions, 
    loading, 
    createEmployee, 
    recordTimeEntry,
    calculateCommissions
  } = useEmployees();

  const [newEmployee, setNewEmployee] = useState({
    full_name: '',
    cpf: '',
    position: '',
    department: '',
    salary: 0,
    hourly_rate: 0,
    commission_rate: 0,
    phone: '',
    email: '',
    address: '',
  });

  const [newTimeEntry, setNewTimeEntry] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    clock_in: '',
    clock_out: '',
    break_duration: 60,
    status: 'present',
    notes: '',
  });

  const handleCreateEmployee = async () => {
    if (!newEmployee.full_name || !newEmployee.position) return;
    
    await createEmployee({
      ...newEmployee,
      hire_date: new Date().toISOString().split('T')[0],
      is_active: true,
    });
    
    setNewEmployee({
      full_name: '',
      cpf: '',
      position: '',
      department: '',
      salary: 0,
      hourly_rate: 0,
      commission_rate: 0,
      phone: '',
      email: '',
      address: '',
    });
  };

  const handleRecordTime = async () => {
    if (!newTimeEntry.employee_id || !newTimeEntry.date) return;
    
    // Calculate total hours if both clock_in and clock_out are provided
    let total_hours = 0;
    if (newTimeEntry.clock_in && newTimeEntry.clock_out) {
      const clockIn = new Date(`2000-01-01T${newTimeEntry.clock_in}`);
      const clockOut = new Date(`2000-01-01T${newTimeEntry.clock_out}`);
      const diffMs = clockOut.getTime() - clockIn.getTime();
      total_hours = (diffMs / (1000 * 60 * 60)) - (newTimeEntry.break_duration / 60);
    }
    
    await recordTimeEntry({
      ...newTimeEntry,
      total_hours: total_hours > 0 ? total_hours : undefined,
      overtime_hours: total_hours > 8 ? total_hours - 8 : 0,
    });
    
    setNewTimeEntry({
      employee_id: '',
      date: new Date().toISOString().split('T')[0],
      clock_in: '',
      clock_out: '',
      break_duration: 60,
      status: 'present',
      notes: '',
    });
  };

  const handleCalculateCommissions = async () => {
    const currentDate = new Date();
    const lastMonth = currentDate.getMonth() === 0 ? 12 : currentDate.getMonth();
    const year = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
    
    await calculateCommissions(lastMonth, year);
  };

  const getActiveEmployees = () => employees.filter(emp => emp.is_active).length;
  
  const getTotalSalaryBudget = () => {
    return employees
      .filter(emp => emp.is_active && emp.salary)
      .reduce((sum, emp) => sum + (emp.salary || 0), 0);
  };

  const getTodayPresence = () => {
    const today = new Date().toISOString().split('T')[0];
    return timeTracking.filter(entry => 
      entry.date === today && entry.status === 'present'
    ).length;
  };

  const getMonthlyCommissions = () => {
    const currentDate = new Date();
    return commissions
      .filter(comm => 
        comm.period_month === currentDate.getMonth() + 1 && 
        comm.period_year === currentDate.getFullYear()
      )
      .reduce((sum, comm) => sum + comm.final_commission, 0);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Funcionários</h1>
          <p className="text-muted-foreground">Gerencie colaboradores, ponto, escalas e comissões</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Funcionários Ativos</p>
                <p className="text-2xl font-bold">{getActiveEmployees()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Presentes Hoje</p>
                <p className="text-2xl font-bold">{getTodayPresence()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Folha de Pagamento</p>
                <p className="text-2xl font-bold">{formatCurrency(getTotalSalaryBudget())}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Comissões do Mês</p>
                <p className="text-2xl font-bold">{formatCurrency(getMonthlyCommissions())}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="employees">Funcionários</TabsTrigger>
          <TabsTrigger value="timetracking">Ponto</TabsTrigger>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
          <TabsTrigger value="schedules">Escalas</TabsTrigger>
        </TabsList>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Funcionários</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Funcionário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cadastrar Funcionário</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome Completo</Label>
                    <Input
                      value={newEmployee.full_name}
                      onChange={(e) => setNewEmployee({...newEmployee, full_name: e.target.value})}
                      placeholder="Nome completo do funcionário"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>CPF</Label>
                      <Input
                        value={newEmployee.cpf}
                        onChange={(e) => setNewEmployee({...newEmployee, cpf: e.target.value})}
                        placeholder="000.000.000-00"
                      />
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <Input
                        value={newEmployee.phone}
                        onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                      placeholder="funcionario@empresa.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cargo</Label>
                      <Input
                        value={newEmployee.position}
                        onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                        placeholder="Ex: Mecânico, Técnico"
                      />
                    </div>
                    <div>
                      <Label>Departamento</Label>
                      <Input
                        value={newEmployee.department}
                        onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                        placeholder="Ex: Produção, Qualidade"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Salário</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newEmployee.salary}
                        onChange={(e) => setNewEmployee({...newEmployee, salary: Number(e.target.value)})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Valor/Hora</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newEmployee.hourly_rate}
                        onChange={(e) => setNewEmployee({...newEmployee, hourly_rate: Number(e.target.value)})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>% Comissão</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newEmployee.commission_rate}
                        onChange={(e) => setNewEmployee({...newEmployee, commission_rate: Number(e.target.value)})}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Endereço</Label>
                    <Textarea
                      value={newEmployee.address}
                      onChange={(e) => setNewEmployee({...newEmployee, address: e.target.value})}
                      placeholder="Endereço completo"
                    />
                  </div>
                  <Button onClick={handleCreateEmployee} className="w-full">
                    Cadastrar Funcionário
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <p>Carregando funcionários...</p>
            ) : employees.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Nenhum funcionário cadastrado</p>
                </CardContent>
              </Card>
            ) : (
              employees.map((employee) => (
                <Card key={employee.id}>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium">{employee.full_name}</h3>
                        <Badge variant={employee.is_active ? "default" : "secondary"}>
                          {employee.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {employee.position} - {employee.department}
                      </p>
                      <p className="text-sm">
                        Matrícula: {employee.employee_number}
                      </p>
                      {employee.phone && (
                        <p className="text-sm text-muted-foreground">
                          Tel: {employee.phone}
                        </p>
                      )}
                      {employee.salary && (
                        <p className="text-sm font-medium">
                          Salário: {formatCurrency(employee.salary)}
                        </p>
                      )}
                      {employee.commission_rate > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Comissão: {employee.commission_rate}%
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Admissão: {new Date(employee.hire_date).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Time Tracking Tab */}
        <TabsContent value="timetracking" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Controle de Ponto</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Clock className="h-4 w-4 mr-2" />
                  Registrar Ponto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Ponto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Funcionário</Label>
                    <Select 
                      value={newTimeEntry.employee_id} 
                      onValueChange={(value) => setNewTimeEntry({...newTimeEntry, employee_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o funcionário" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.filter(emp => emp.is_active).map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.full_name} - {employee.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Data</Label>
                      <Input
                        type="date"
                        value={newTimeEntry.date}
                        onChange={(e) => setNewTimeEntry({...newTimeEntry, date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select 
                        value={newTimeEntry.status} 
                        onValueChange={(value) => setNewTimeEntry({...newTimeEntry, status: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Presente</SelectItem>
                          <SelectItem value="absent">Ausente</SelectItem>
                          <SelectItem value="vacation">Férias</SelectItem>
                          <SelectItem value="sick">Atestado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {newTimeEntry.status === 'present' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Hora Entrada</Label>
                          <Input
                            type="time"
                            value={newTimeEntry.clock_in}
                            onChange={(e) => setNewTimeEntry({...newTimeEntry, clock_in: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label>Hora Saída</Label>
                          <Input
                            type="time"
                            value={newTimeEntry.clock_out}
                            onChange={(e) => setNewTimeEntry({...newTimeEntry, clock_out: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Intervalo (minutos)</Label>
                        <Input
                          type="number"
                          value={newTimeEntry.break_duration}
                          onChange={(e) => setNewTimeEntry({...newTimeEntry, break_duration: Number(e.target.value)})}
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={newTimeEntry.notes}
                      onChange={(e) => setNewTimeEntry({...newTimeEntry, notes: e.target.value})}
                      placeholder="Observações sobre o ponto"
                    />
                  </div>
                  <Button onClick={handleRecordTime} className="w-full">
                    Registrar Ponto
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {timeTracking.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Nenhum registro de ponto encontrado</p>
                </CardContent>
              </Card>
            ) : (
              timeTracking.slice(0, 10).map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{entry.employee?.full_name}</p>
                          <Badge className={TIME_STATUS_COLORS[entry.status as keyof typeof TIME_STATUS_COLORS] || 'bg-gray-100'}>
                            {entry.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Data: {new Date(entry.date).toLocaleDateString()}
                        </p>
                        {entry.clock_in && entry.clock_out && (
                          <p className="text-sm">
                            {entry.clock_in} - {entry.clock_out}
                            {entry.total_hours && (
                              <span className="text-muted-foreground"> ({entry.total_hours.toFixed(2)}h)</span>
                            )}
                          </p>
                        )}
                        {entry.overtime_hours > 0 && (
                          <p className="text-sm text-orange-600">
                            Horas extras: {entry.overtime_hours.toFixed(2)}h
                          </p>
                        )}
                        {entry.notes && (
                          <p className="text-sm text-muted-foreground">
                            Obs: {entry.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Comissões</h2>
            <Button onClick={handleCalculateCommissions}>
              <DollarSign className="h-4 w-4 mr-2" />
              Calcular Comissões
            </Button>
          </div>

          <div className="space-y-4">
            {commissions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Nenhuma comissão calculada</p>
                </CardContent>
              </Card>
            ) : (
              commissions.map((commission) => (
                <Card key={commission.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{commission.employee?.full_name}</p>
                          <Badge variant="outline">
                            {commission.period_month}/{commission.period_year}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Taxa: {commission.commission_rate}%
                        </p>
                        <p className="text-sm">
                          Vendas Base: {formatCurrency(commission.base_sales)}
                        </p>
                        <p className="text-lg font-semibold text-green-600">
                          Comissão: {formatCurrency(commission.final_commission)}
                        </p>
                      </div>
                      <Badge className={commission.status === 'paid' ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'}>
                        {commission.status === 'paid' ? 'Paga' : 'Pendente'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-4">
          <h2 className="text-lg font-semibold">Escalas de Trabalho</h2>
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Sistema de escalas em desenvolvimento</p>
              <p className="text-sm text-muted-foreground mt-2">
                Em breve você poderá gerenciar turnos, plantões e horários de trabalho
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}