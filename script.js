document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo dữ liệu
    let projects = JSON.parse(localStorage.getItem('projects')) || [];
    let contracts = JSON.parse(localStorage.getItem('contracts')) || [];
    let contractors = JSON.parse(localStorage.getItem('contractors')) || [
        { id: 1, name: 'Nhà thầu X' },
        { id: 2, name: 'Nhà thầu Y' }
    ];
    let revenues = JSON.parse(localStorage.getItem('revenues')) || [];
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

    // Lưu dữ liệu vào localStorage
    const saveData = () => {
        localStorage.setItem('projects', JSON.stringify(projects));
        localStorage.setItem('contracts', JSON.stringify(contracts));
        localStorage.setItem('contractors', JSON.stringify(contractors));
        localStorage.setItem('revenues', JSON.stringify(revenues));
        localStorage.setItem('expenses', JSON.stringify(expenses));
    };

    // Cập nhật dropdown
    const updateDropdowns = () => {
        const projectSelects = document.querySelectorAll('#project, #revenueProject, #expenseProject');
        const contractSelects = document.querySelectorAll('#revenueContract, #expenseContract');
        const contractorSelect = document.getElementById('contractors');

        projectSelects.forEach(select => {
            select.innerHTML = '<option value="">Chọn dự án</option>' + projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        });

        contractorSelect.innerHTML = contractors.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

        contractSelects.forEach(select => {
            const projectId = select.parentElement.querySelector('[name$="Project"]').value;
            select.innerHTML = '<option value="">Chọn hợp đồng</option>' +
                contracts.filter(c => c.projectId == projectId).map(c => `<option value="${c.id}">${c.name}</option>`).join('');
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

    // Cập nhật bảng hợp đồng
    const updateContractTable = () => {
        const table = document.getElementById('contractTable').getElementsByTagName('tbody')[0];
        table.innerHTML = contracts.map(c => {
            const totalRevenue = revenues.filter(r => r.contractId == c.id).reduce((sum, r) => sum + Number(r.amount), 0);
            const totalExpense = expenses.filter(e => e.contractId == c.id).reduce((sum, e) => sum + Number(e.amount), 0);
            return `
            <tr>
                <td>${projects.find(p => p.id == c.projectId)?.name || 'N/A'}</td>
                <td>${c.name}</td>
                <td>${c.partner}</td>
                <td>${Number(c.value).toLocaleString('vi-VN')} ₫</td>
                <td>${c.startDate}</td>
                <td>${c.endDate}</td>
                <td>${c.status}</td>
                <td>${c.progress}%</td>
                <td>${c.contractors.map(id => contractors.find(c => c.id == id)?.name).join(', ')}</td>
                <td>${totalRevenue.toLocaleString('vi-VN')} ₫</td>
                <td>${totalExpense.toLocaleString('vi-VN')} ₫</td>
                <td><button onclick="showProgressModal(${c.id})">Cập nhật</button> <button onclick="deleteContract(${c.id})">Xóa</button></td>
            </tr>
        `}).join('');
    };

    // Cập nhật bảng doanh thu
    const updateRevenueTable = () => {
        const table = document.getElementById('revenueTable').getElementsByTagName('tbody')[0];
        table.innerHTML = revenues.map(r => `
            <tr>
                <td>${projects.find(p => p.id == contracts.find(c => c.id == r.contractId)?.projectId)?.name || 'N/A'}</td>
                <td>${contracts.find(c => c.id == r.contractId)?.name || 'N/A'}</td>
                <td>${Number(r.amount).toLocaleString('vi-VN')} ₫</td>
                <td>${r.date}</td>
                <td>${r.type}</td>
                <td>${r.note}</td>
                <td><button onclick="deleteRevenue(${r.id})">Xóa</button></td>
            </tr>
        `).join('');
    };

    // Cập nhật bảng chi phí
    const updateExpenseTable = () => {
        const table = document.getElementById('expenseTable').getElementsByTagName('tbody')[0];
        table.innerHTML = expenses.map(e => `
            <tr>
                <td>${projects.find(p => p.id == contracts.find(c => c.id == e.contractId)?.projectId)?.name || 'N/A'}</td>
                <td>${contracts.find(c => c.id == e.contractId)?.name || 'N/A'}</td>
                <td>${Number(e.amount).toLocaleString('vi-VN')} ₫</td>
                <td>${e.date}</td>
                <td>${e.type}</td>
                <td>${e.note}</td>
                <td><button onclick="deleteExpense(${e.id})">Xóa</button></td>
            </tr>
        `).join('');
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
            const totalRevenue = projectRevenues.reduce((sum, r) => sum + Number(r.amount), 0);
            const totalExpense = projectExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
            return {
                project: project.name,
                contracts: projectContracts.map(c => c.name).join(', '),
                revenue: totalRevenue,
                expense: totalExpense,
                profit: totalRevenue - totalExpense
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
                <td>${r.contracts || 'N/A'}</td>
                <td>${r.revenue.toLocaleString('vi-VN')} ₫</td>
                <td>${r.expense.toLocaleString('vi-VN')} ₫</td>
                <td>${r.profit.toLocaleString('vi-VN')} ₫</td>
            </tr>
        `).join('');
    };

    // Cập nhật tổng quan
    const updateOverview = () => {
        const month = new Date().toISOString().slice(0, 7);
        const monthlyRevenues = revenues.filter(r => r.date.startsWith(month));
        const monthlyExpenses = expenses.filter(e => e.date.startsWith(month));
        const monthlyRevenue = monthlyRevenues.reduce((sum, r) => sum + Number(r.amount), 0);
        const monthlyProfit = monthlyRevenue - monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

        document.getElementById('totalProjects').textContent = projects.length;
        document.getElementById('totalContracts').textContent = contracts.length;
        document.getElementById('activeContracts').textContent = contracts.filter(c => c.status === 'Đang thực hiện').length;
        document.getElementById('monthlyRevenue').textContent = monthlyRevenue.toLocaleString('vi-VN') + ' ₫';
        document.getElementById('monthlyProfit').textContent = monthlyProfit.toLocaleString('vi-VN') + ' ₫';

        const recent = contracts.slice(-5).map(c => `<li>${c.name} (${projects.find(p => p.id == c.projectId)?.name || 'N/A'})</li>`).join('');
        document.getElementById('recentContracts').innerHTML = recent;

        const today = new Date();
        const expiring = contracts
            .filter(c => {
                const endDate = new Date(c.endDate);
                const diffDays = (endDate - today) / (1000 * 60 * 60 * 24);
                return diffDays <= 30 && diffDays >= 0 && c.status !== 'Hoàn thành';
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
            projectId: document.getElementById('project').value,
            name: document.getElementById('contractName').value,
            partner: document.getElementById('partner').value,
            value: document.getElementById('contractValue').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            status: document.getElementById('status').value,
            progress: document.getElementById('progress').value,
            contractors: Array.from(document.getElementById('contractors').selectedOptions).map(opt => Number(opt.value)),
            description: document.getElementById('description').value
        };
        contracts.push(contract);
        saveData();
        updateContractTable();
        updateOverview();
        document.getElementById('contractForm').reset();
    });

    // Thêm doanh thu
    document.getElementById('revenueForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const revenue = {
            id: Date.now(),
            projectId: document.getElementById('revenueProject').value,
            contractId: document.getElementById('revenueContract').value,
            amount: document.getElementById('revenueAmount').value,
            date: document.getElementById('revenueDate').value,
            type: document.getElementById('revenueType').value,
            note: document.getElementById('revenueNote').value
        };
        revenues.push(revenue);
        saveData();
        updateRevenueTable();
        updateContractTable();
        updateOverview();
        document.getElementById('revenueForm').reset();
    });

    // Thêm chi phí
    document.getElementById('expenseForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const expense = {
            id: Date.now(),
            projectId: document.getElementById('expenseProject').value,
            contractId: document.getElementById('expenseContract').value,
            amount: document.getElementById('expenseAmount').value,
            date: document.getElementById('expenseDate').value,
            type: document.getElementById('expenseType').value,
            note: document.getElementById('expenseNote').value
        };
        expenses.push(expense);
        saveData();
        updateExpenseTable();
        updateContractTable();
        updateOverview();
        document.getElementById('expenseForm').reset();
    });

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
        updateContractTable();
        updateOverview();
    };

    // Xóa chi phí
    window.deleteExpense = (id) => {
        expenses = expenses.filter(e => e.id !== id);
        saveData();
        updateExpenseTable();
        updateContractTable();
        updateOverview();
    };

    // Cập nhật tiến độ hợp đồng
    window.showProgressModal = (contractId) => {
        const modal = document.getElementById('progressModal');
        const progressForm = document.getElementById('progressForm');
        const contract = contracts.find(c => c.id == contractId);
        const progressValue = document.getElementById('progressValue');
        const progressDisplay = document.getElementById('progressDisplay');

        progressValue.value = contract.progress;
        progressDisplay.textContent = `${contract.progress}%`;
        progressValue.oninput = () => progressDisplay.textContent = `${progressValue.value}%`;

        progressForm.onsubmit = (e) => {
            e.preventDefault();
            contract.progress = progressValue.value;
            saveData();
            updateContractTable();
            modal.style.display = 'none';
        };
        modal.style.display = 'block';
    };

    // Đóng modal
    document.getElementsByClassName('close')[0].onclick = () => {
        document.getElementById('progressModal').style.display = 'none';
    };

    // Liên kết dropdown dự án với hợp đồng
    document.querySelectorAll('#revenueProject, #expenseProject').forEach(select => {
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
        ...c,
        contractors: c.contractors.map(id => contractors.find(c => c.id == id)?.name).join(', ')
    })), 'Contracts'));
    document.getElementById('exportRevenue').addEventListener('click', () => exportToExcel(revenues.map(r => ({
        project: projects.find(p => p.id == contracts.find(c => c.id == r.contractId)?.projectId)?.name,
        contract: contracts.find(c => c.id == r.contractId)?.name,
        ...r
    })), 'Revenue'));
    document.getElementById('exportExpenses').addEventListener('click', () => exportToExcel(expenses.map(e => ({
        project: projects.find(p => p.id == contracts.find(c => c.id == e.contractId)?.projectId)?.name,
        contract: contracts.find(c => c.id == e.contractId)?.name,
        ...e
    })), 'Expenses'));
    document.getElementById('exportReports').addEventListener('click', () => {
        const reportData = Array.from(document.getElementById('reportDetails').getElementsByTagName('tbody')[0].rows).map(row => ({
            project: row.cells[0].textContent,
            contracts: row.cells[1].textContent,
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
});
