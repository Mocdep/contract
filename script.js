document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo dữ liệu
    let projects = JSON.parse(localStorage.getItem('projects')) || [];
    let contracts = JSON.parse(localStorage.getItem('contracts')) || [];
    let revenues = JSON.parse(localStorage.getItem('revenues')) || [];
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

    // Lưu dữ liệu vào localStorage
    const saveData = () => {
        localStorage.setItem('projects', JSON.stringify(projects));
        localStorage.setItem('contracts', JSON.stringify(contracts));
        localStorage.setItem('revenues', JSON.stringify(revenues));
        localStorage.setItem('expenses', JSON.stringify(expenses));
    };

    // Cập nhật dropdown
    const updateDropdowns = () => {
        const projectSelects = document.querySelectorAll('#project, #revenueProject, #expenseProject, #editProject, #editRevenueProject, #editExpenseProject, #selectedProject, #overviewProject');
        const contractSelects = document.querySelectorAll('#revenueContract, #expenseContract, #editRevenueContract, #editExpenseContract');

        projectSelects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Chọn dự án</option>' + projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
            if (currentValue && projects.some(p => p.id == currentValue)) select.value = currentValue;
        });

        contractSelects.forEach(select => {
            const projectSelect = select.parentElement.querySelector('[name$="Project"]') || select.parentElement.querySelector('#editRevenueProject') || select.parentElement.querySelector('#editExpenseProject');
            const projectId = projectSelect ? projectSelect.value : '';
            const currentValue = select.value;
            const filteredContracts = projectId ? contracts.filter(c => c.projectId == projectId) : [];
            const validContracts = select.id.includes('Revenue') ? filteredContracts.filter(c => c.contractType === 'Tạo doanh thu') : filteredContracts.filter(c => c.contractType === 'Tạo chi phí');
            select.innerHTML = '<option value="">Chọn hợp đồng</option>' + validContracts.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            if (currentValue && validContracts.some(c => c.id == currentValue)) select.value = currentValue;
        });
    };

    // Cập nhật bảng dự án
    const updateProjectTable = () => {
        const table = document.getElementById('projectTable').getElementsByTagName('tbody')[0];
        table.innerHTML = projects.map(p => `
            <tr>
                <td>${p.name}</td>
                <td>${p.startDate}</td>
                <td>${p.endDate}</td>
                <td><button onclick="deleteProject(${p.id})">Xóa</button></td>
            </tr>
        `).join('');
        updateDropdowns();
    };

    // Cập nhật chi tiết dự án
    window.updateProjectDetails = () => {
        const projectId = document.getElementById('selectedProject').value;
        if (!projectId) {
            document.getElementById('projectDetailTable').getElementsByTagName('tbody')[0].innerHTML = '';
            return;
        }
        const projectContracts = contracts.filter(c => c.projectId == projectId);
        const contractRevenue = projectContracts.filter(c => c.contractType === 'Tạo doanh thu').reduce((sum, c) => sum + Number(c.value), 0);
        const contractExpense = projectContracts.filter(c => c.contractType === 'Tạo chi phí').reduce((sum, c) => sum + Number(c.value), 0);
        const projectRevenues = revenues.filter(r => projectContracts.some(c => c.id == r.contractId));
        const projectExpenses = expenses.filter(e => projectContracts.some(c => c.id == e.contractId));
        const revenueTotal = contractRevenue + projectRevenues.reduce((sum, r) => sum + Number(r.amount), 0);
        const expenseTotal = contractExpense + projectExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const profit = revenueTotal - expenseTotal;

        const table = document.getElementById('projectDetailTable').getElementsByTagName('tbody')[0];
        table.innerHTML = `
            <tr>
                <td>${projectContracts.length}</td>
                <td>${revenueTotal.toLocaleString('vi-VN')} ₫</td>
                <td>${expenseTotal.toLocaleString('vi-VN')} ₫</td>
                <td>${profit.toLocaleString('vi-VN')} ₫</td>
            </tr>
        `;
    };

    // Cập nhật bảng hợp đồng
    const updateContractTable = () => {
        const table = document.getElementById('contractTable').getElementsByTagName('tbody')[0];
        table.innerHTML = contracts.map(c => {
            const totalRevenue = c.contractType === 'Tạo doanh thu' ? Number(c.value) : 0;
            const totalExpense = c.contractType === 'Tạo chi phí' ? Number(c.value) : 0;
            return `
            <tr>
                <td>${projects.find(p => p.id == c.projectId)?.name || 'N/A'}</td>
                <td>${c.name}</td>
                <td>${c.partner}</td>
                <td>${c.contractType}</td>
                <td>${Number(c.value).toLocaleString('vi-VN')} ₫</td>
                <td>${c.startDate}</td>
                <td>${c.endDate}</td>
                <td>${c.status}</td>
                <td>${totalRevenue.toLocaleString('vi-VN')} ₫</td>
                <td>${totalExpense.toLocaleString('vi-VN')} ₫</td>
                <td>
                    <button onclick="editContract(${c.id})">Sửa</button>
                    <button onclick="showProgressModal(${c.id})">Cập nhật</button>
                    <button class="delete" onclick="deleteContract(${c.id})">Xóa</button>
                </td>
            </tr>
        `}).join('');
    };

    // Cập nhật bảng doanh thu
    const updateRevenueTable = () => {
        const table = document.getElementById('revenueTable').getElementsByTagName('tbody')[0];
        table.innerHTML = revenues.map(r => {
            const contract = contracts.find(c => c.id == r.contractId);
            return `
            <tr>
                <td>${projects.find(p => p.id == r.projectId)?.name || 'N/A'}</td>
                <td>${contract?.name || 'N/A'}</td>
                <td>${Number(r.amount).toLocaleString('vi-VN')} ₫</td>
                <td>${r.date}</td>
                <td>${r.type}</td>
                <td>${r.note}</td>
                <td>
                    <button onclick="editRevenue(${r.id})">Sửa</button>
                    <button class="delete" onclick="deleteRevenue(${r.id})">Xóa</button>
                </td>
            </tr>
        `}).join('');
    };

    // Cập nhật bảng chi phí
    const updateExpenseTable = () => {
        const table = document.getElementById('expenseTable').getElementsByTagName('tbody')[0];
        table.innerHTML = expenses.map(e => {
            const contract = contracts.find(c => c.id == e.contractId);
            return `
            <tr>
                <td>${projects.find(p => p.id == e.projectId)?.name || 'N/A'}</td>
                <td>${contract?.name || 'N/A'}</td>
                <td>${Number(e.amount).toLocaleString('vi-VN')} ₫</td>
                <td>${e.date}</td>
                <td>${e.type}</td>
                <td>${e.note}</td>
                <td>
                    <button onclick="editExpense(${e.id})">Sửa</button>
                    <button class="delete" onclick="deleteExpense(${e.id})">Xóa</button>
                </td>
            </tr>
        `}).join('');
    };

    // Cập nhật báo cáo
    const updateReport = () => {
        const reportType = document.getElementById('reportType').value;
        const reportPeriod = document.getElementById('reportPeriod').value;
        let periodFilter = r => r.date.startsWith(reportPeriod.slice(0, reportType === 'Theo năm' ? 4 : 7));

        if (reportType === 'Theo quý') {
            const [year, month] = reportPeriod.split('-').map(Number);
            const quarterStart = Math.floor((month - 1) / 3) * 3 + 1;
            periodFilter = r => {
                const [rYear, rMonth] = r.date.split('-').map(Number);
                return rYear === year && rMonth >= quarterStart && rMonth < quarterStart + 3;
            };
        }

        const filteredRevenues = revenues.filter(periodFilter);
        const filteredExpenses = expenses.filter(periodFilter);

        const reportData = projects.map(project => {
            const projectContracts = contracts.filter(c => c.projectId == project.id);
            const projectRevenues = filteredRevenues.filter(r => projectContracts.some(c => c.id == r.contractId));
            const projectExpenses = filteredExpenses.filter(e => projectContracts.some(c => c.id == e.contractId));
            const contractRevenue = projectContracts.filter(c => c.contractType === 'Tạo doanh thu').reduce((sum, c) => sum + Number(c.value), 0);
            const contractExpense = projectContracts.filter(c => c.contractType === 'Tạo chi phí').reduce((sum, c) => sum + Number(c.value), 0);
            const revenueTotal = contractRevenue + projectRevenues.reduce((sum, r) => sum + Number(r.amount), 0);
            const expenseTotal = contractExpense + projectExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
            return {
                project: project.name,
                contractCount: projectContracts.length,
                revenue: revenueTotal,
                expense: expenseTotal,
                profit: revenueTotal - expenseTotal
            };
        });

        const totalRevenue = reportData.reduce((sum, r) => sum + r.revenue, 0);
        const totalExpenses = reportData.reduce((sum, r) => sum + r.expense, 0);
        const profit = totalRevenue - totalExpenses;
        const tax = profit * 0.2;

        document.getElementById('totalRevenue').textContent = totalRevenue.toLocaleString('vi-VN') + ' ₫';
        document.getElementById('totalExpenses').textContent = totalExpenses.toLocaleString('vi-VN') + ' ₫';
        document.getElementById('profit').textContent = profit.toLocaleString('vi-VN') + ' ₫';
        document.getElementById('tax').textContent = tax.toLocaleString('vi-VN') + ' ₫';

        const table = document.getElementById('reportDetails').getElementsByTagName('tbody')[0];
        table.innerHTML = reportData.map(r => `
            <tr>
                <td>${r.project}</td>
                <td>${r.contractCount}</td>
                <td>${r.revenue.toLocaleString('vi-VN')} ₫</td>
                <td>${r.expense.toLocaleString('vi-VN')} ₫</td>
                <td>${r.profit.toLocaleString('vi-VN')} ₫</td>
            </tr>
        `).join('');
    };

    // Cập nhật chi tiết tổng quan
    window.updateOverviewDetails = () => {
        const projectId = document.getElementById('overviewProject').value;
        if (!projectId) {
            document.getElementById('overviewDetailTable').getElementsByTagName('tbody')[0].innerHTML = '';
            return;
        }
        const projectContracts = contracts.filter(c => c.projectId == projectId);
        const contractRevenue = projectContracts.filter(c => c.contractType === 'Tạo doanh thu').reduce((sum, c) => sum + Number(c.value), 0);
        const contractExpense = projectContracts.filter(c => c.contractType === 'Tạo chi phí').reduce((sum, c) => sum + Number(c.value), 0);
        const projectRevenues = revenues.filter(r => projectContracts.some(c => c.id == r.contractId));
        const projectExpenses = expenses.filter(e => projectContracts.some(c => c.id == e.contractId));
        const revenueTotal = contractRevenue + projectRevenues.reduce((sum, r) => sum + Number(r.amount), 0);
        const expenseTotal = contractExpense + projectExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const profit = revenueTotal - expenseTotal;

        const table = document.getElementById('overviewDetailTable').getElementsByTagName('tbody')[0];
        table.innerHTML = `
            <tr>
                <td>${projectContracts.length}</td>
                <td>${revenueTotal.toLocaleString('vi-VN')} ₫</td>
                <td>${expenseTotal.toLocaleString('vi-VN')} ₫</td>
                <td>${profit.toLocaleString('vi-VN')} ₫</td>
            </tr>
        `;
    };

    // Cập nhật tổng quan
    const updateOverview = () => {
        const month = new Date().toISOString().slice(0, 7);
        const monthlyRevenues = revenues.filter(r => r.date.startsWith(month));
        const monthlyExpenses = expenses.filter(r => r.date.startsWith(month));
        const contractRevenue = contracts.filter(c => c.contractType === 'Tạo doanh thu' && c.startDate.startsWith(month)).reduce((sum, c) => sum + Number(c.value), 0);
        const contractExpense = contracts.filter(c => c.contractType === 'Tạo chi phí' && c.startDate.startsWith(month)).reduce((sum, c) => sum + Number(c.value), 0);
        const monthlyRevenue = contractRevenue + monthlyRevenues.reduce((sum, r) => sum + Number(r.amount), 0);
        const monthlyExpense = contractExpense + monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const monthlyProfit = monthlyRevenue - monthlyExpense;

        document.getElementById('totalProjects').textContent = projects.length;
        document.getElementById('totalContracts').textContent = contracts.length;
        document.getElementById('activeContracts').textContent = contracts.filter(c => ['Vừa ký hợp đồng', 'Đang thi công', 'Đang nghiệm thu bàn giao', 'Đang trong thời gian bảo hành'].includes(c.status)).length;
        document.getElementById('monthlyRevenue').textContent = monthlyRevenue.toLocaleString('vi-VN') + ' ₫';
        document.getElementById('monthlyProfit').textContent = monthlyProfit.toLocaleString('vi-VN') + ' ₫';

        const recent = contracts.slice(-5).map(c => `<li>${c.name} (${projects.find(p => p.id == c.projectId)?.name || 'N/A'})</li>`).join('');
        document.getElementById('recentContracts').innerHTML = recent;

        const today = new Date();
        const expiring = contracts
            .filter(c => {
                const endDate = new Date(c.endDate);
                const diffDays = (endDate - today) / (1000 * 60 * 60 * 24);
                return diffDays <= 30 && diffDays >= 0 && ['Vừa ký hợp đồng', 'Đang thi công', 'Đang nghiệm thu bàn giao'].includes(c.status);
            })
            .map(c => `<li>${c.name} (${c.endDate})</li>`).join('');
        document.getElementById('expiringContracts').innerHTML = expiring;
    };

    // Thêm dự án
    document.getElementById('projectForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const project = {
            id: Date.now(),
            name: document.getElementById('projectName').value,
            startDate: document.getElementById('projectStartDate').value,
            endDate: document.getElementById('projectEndDate').value
        };
        projects.push(project);
        saveData();
        updateProjectTable();
        document.getElementById('projectForm').reset();
    });

    // Thêm hợp đồng
    document.getElementById('contractForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const contract = {
            id: Date.now(),
            projectId: Number(document.getElementById('project').value),
            name: document.getElementById('contractName').value,
            partner: document.getElementById('partner').value,
            contractType: document.getElementById('contractType').value,
            value: document.getElementById('contractValue').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            status: document.getElementById('status').value,
            description: document.getElementById('description').value
        };
        contracts.push(contract);
        saveData();
        updateContractTable();
        updateOverview();
        document.getElementById('contractForm').reset();
    });

    // Sửa hợp đồng
    window.editContract = (id) => {
        const modal = document.getElementById('editContractModal');
        const form = document.getElementById('editContractForm');
        const contract = contracts.find(c => c.id == id);

        document.getElementById('editProject').value = contract.projectId;
        document.getElementById('editContractName').value = contract.name;
        document.getElementById('editPartner').value = contract.partner;
        document.getElementById('editContractType').value = contract.contractType;
        document.getElementById('editContractValue').value = contract.value;
        document.getElementById('editStartDate').value = contract.startDate;
        document.getElementById('editEndDate').value = contract.endDate;
        document.getElementById('editStatus').value = contract.status;
        document.getElementById('editDescription').value = contract.description;

        form.onsubmit = (e) => {
            e.preventDefault();
            contract.projectId = Number(document.getElementById('editProject').value);
            contract.name = document.getElementById('editContractName').value;
            contract.partner = document.getElementById('editPartner').value;
            contract.contractType = document.getElementById('editContractType').value;
            contract.value = document.getElementById('editContractValue').value;
            contract.startDate = document.getElementById('editStartDate').value;
            contract.endDate = document.getElementById('editEndDate').value;
            contract.status = document.getElementById('editStatus').value;
            contract.description = document.getElementById('editDescription').value;
            saveData();
            updateContractTable();
            updateOverview();
            modal.style.display = 'none';
        };
        modal.style.display = 'block';
    };

    // Thêm doanh thu
    document.getElementById('revenueForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const revenue = {
            id: Date.now(),
            projectId: Number(document.getElementById('revenueProject').value),
            contractId: Number(document.getElementById('revenueContract').value),
            amount: document.getElementById('revenueAmount').value,
            date: document.getElementById('revenueDate').value,
            type: document.getElementById('revenueType').value,
            note: document.getElementById('revenueNote').value
        };
        revenues.push(revenue);
        saveData();
        updateRevenueTable();
        updateReport();
        updateOverview();
        document.getElementById('revenueForm').reset();
        updateDropdowns(); // Đảm bảo dropdown hợp đồng được cập nhật
    });

    // Sửa doanh thu
    window.editRevenue = (id) => {
        const modal = document.getElementById('editRevenueModal');
        const form = document.getElementById('editRevenueForm');
        const revenue = revenues.find(r => r.id == id);

        document.getElementById('editRevenueProject').value = revenue.projectId;
        updateDropdowns(); // Cập nhật dropdown hợp đồng
        document.getElementById('editRevenueContract').value = revenue.contractId;
        document.getElementById('editRevenueAmount').value = revenue.amount;
        document.getElementById('editRevenueDate').value = revenue.date;
        document.getElementById('editRevenueType').value = revenue.type;
        document.getElementById('editRevenueNote').value = revenue.note;

        form.onsubmit = (e) => {
            e.preventDefault();
            revenue.projectId = Number(document.getElementById('editRevenueProject').value);
            revenue.contractId = Number(document.getElementById('editRevenueContract').value);
            revenue.amount = document.getElementById('editRevenueAmount').value;
            revenue.date = document.getElementById('editRevenueDate').value;
            revenue.type = document.getElementById('editRevenueType').value;
            revenue.note = document.getElementById('editRevenueNote').value;
            saveData();
            updateRevenueTable();
            updateReport();
            updateOverview();
            modal.style.display = 'none';
        };
        modal.style.display = 'block';
    };

    // Thêm chi phí
    document.getElementById('expenseForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const expense = {
            id: Date.now(),
            projectId: Number(document.getElementById('expenseProject').value),
            contractId: Number(document.getElementById('expenseContract').value),
            amount: document.getElementById('expenseAmount').value,
            date: document.getElementById('expenseDate').value,
            type: document.getElementById('expenseType').value,
            note: document.getElementById('expenseNote').value
        };
        expenses.push(expense);
        saveData();
        updateExpenseTable();
        updateReport();
        updateOverview();
        document.getElementById('expenseForm').reset();
        updateDropdowns(); // Đảm bảo dropdown hợp đồng được cập nhật
    });

    // Sửa chi phí
    window.editExpense = (id) => {
        const modal = document.getElementById('editExpenseModal');
        const form = document.getElementById('editExpenseForm');
        const expense = expenses.find(e => e.id == id);

        document.getElementById('editExpenseProject').value = expense.projectId;
        updateDropdowns(); // Cập nhật dropdown hợp đồng
        document.getElementById('editExpenseContract').value = expense.contractId;
        document.getElementById('editExpenseAmount').value = expense.amount;
        document.getElementById('editExpenseDate').value = expense.date;
        document.getElementById('editExpenseType').value = expense.type;
        document.getElementById('editExpenseNote').value = expense.note;

        form.onsubmit = (e) => {
            e.preventDefault();
            expense.projectId = Number(document.getElementById('editExpenseProject').value);
            expense.contractId = Number(document.getElementById('editExpenseContract').value);
            expense.amount = document.getElementById('editExpenseAmount').value;
            expense.date = document.getElementById('editExpenseDate').value;
            expense.type = document.getElementById('editExpenseType').value;
            expense.note = document.getElementById('editExpenseNote').value;
            saveData();
            updateExpenseTable();
            updateReport();
            updateOverview();
            modal.style.display = 'none';
        };
        modal.style.display = 'block';
    };

    // Xử lý báo cáo
    document.getElementById('reportForm').addEventListener('submit', (e) => {
        e.preventDefault();
        updateReport();
    });

    // Xóa dự án
    window.deleteProject = (id) => {
        projects = projects.filter(p => p.id !== id);
        contracts = contracts.filter(c => c.projectId != id);
        revenues = revenues.filter(r => !contracts.some(c => c.id == r.contractId));
        expenses = expenses.filter(e => !contracts.some(c => c.id == e.contractId));
        saveData();
        updateProjectTable();
        updateContractTable();
        updateRevenueTable();
        updateExpenseTable();
        updateOverview();
    };

    // Xóa hợp đồng
    window.deleteContract = (id) => {
        contracts = contracts.filter(c => c.id !== id);
        revenues = revenues.filter(r => r.contractId != id);
        expenses = expenses.filter(e => e.contractId != id);
        saveData();
        updateContractTable();
        updateRevenueTable();
        updateExpenseTable();
        updateOverview();
    };

    // Xóa doanh thu
    window.deleteRevenue = (id) => {
        revenues = revenues.filter(r => r.id !== id);
        saveData();
        updateRevenueTable();
        updateReport();
        updateOverview();
    };

    // Xóa chi phí
    window.deleteExpense = (id) => {
        expenses = expenses.filter(e => e.id !== id);
        saveData();
        updateExpenseTable();
        updateReport();
        updateOverview();
    };

    // Cập nhật trạng thái hợp đồng
    window.showProgressModal = (contractId) => {
        const modal = document.getElementById('progressModal');
        const progressForm = document.getElementById('progressForm');
        const contract = contracts.find(c => c.id == contractId);
        const progressValue = document.getElementById('progressValue');

        progressValue.value = contract.status;

        progressForm.onsubmit = (e) => {
            e.preventDefault();
            contract.status = progressValue.value;
            saveData();
            updateContractTable();
            modal.style.display = 'none';
        };
        modal.style.display = 'block';
    };

    // Đóng modal
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.onclick = () => {
            closeBtn.closest('.modal').style.display = 'none';
        };
    });

    // Liên kết dropdown dự án với hợp đồng
    document.querySelectorAll('#revenueProject, #expenseProject, #editRevenueProject, #editExpenseProject').forEach(select => {
        select.addEventListener('change', updateDropdowns);
    });

    // Xuất Excel
    const exportToExcel = (data, sheetName) => {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `${sheetName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    document.getElementById('exportProjects').addEventListener('click', () => exportToExcel(projects, 'Projects'));
    document.getElementById('exportContracts').addEventListener('click', () => exportToExcel(contracts.map(c => ({
        project: projects.find(p => p.id == c.projectId)?.name,
        ...c
    })), 'Contracts'));
    document.getElementById('exportRevenue').addEventListener('click', () => exportToExcel(revenues.map(r => ({
        project: projects.find(p => p.id == r.projectId)?.name,
        contract: contracts.find(c => c.id == r.contractId)?.name,
        ...r
    })), 'Revenue'));
    document.getElementById('exportExpenses').addEventListener('click', () => exportToExcel(expenses.map(e => ({
        project: projects.find(p => p.id == e.projectId)?.name,
        contract: contracts.find(c => c.id == e.contractId)?.name,
        ...e
    })), 'Expenses'));
    document.getElementById('exportReports').addEventListener('click', () => {
        const reportData = Array.from(document.getElementById('reportDetails').getElementsByTagName('tbody')[0].rows).map(row => ({
            project: row.cells[0].textContent,
            contractCount: row.cells[1].textContent,
            revenue: row.cells[2].textContent,
            expense: row.cells[3].textContent,
            profit: row.cells[4].textContent
        }));
        exportToExcel(reportData, 'Reports');
    });
    document.getElementById('exportOverview').addEventListener('click', () => exportToExcel([{
        totalProjects: document.getElementById('totalProjects').textContent,
        totalContracts: document.getElementById('totalContracts').textContent,
        activeContracts: document.getElementById('activeContracts').textContent,
        monthlyRevenue: document.getElementById('monthlyRevenue').textContent,
        monthlyProfit: document.getElementById('monthlyProfit').textContent
    }], 'Overview'));

    // Khởi tạo
    updateProjectTable();
    updateContractTable();
    updateRevenueTable();
    updateExpenseTable();
    updateOverview();
    updateProjectDetails();
    updateOverviewDetails();
});
