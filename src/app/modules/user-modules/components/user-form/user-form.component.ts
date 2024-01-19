import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BreadcrumbItem, ConfigService } from 'src/app/shared';
import { getRole, getAllRoles, getRoleObject } from 'src/app/shared';
import { AuthService } from 'src/app/core';
import { UserService } from '../../services/user.service';
import { ToastrServiceService } from 'src/app/shared/services/toastr/toastr.service';
import { SharedService } from 'src/app/shared/services/shared.service';


@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup
  isUsertable: boolean = true;
  statusList:any[]=['Active', 'Inactive']
  roleList:any[]= getAllRoles();
  userDetails:any;
  isEditUser:boolean = false;
  loggedInUserData: any;
  isProcessing: boolean = false;
  otherCouncilsList: any[] = [];
  councilsList: any[] = [];
  departmentsList = [];
  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Grievance Management', url: '/home' },
    { label: 'User List', url: '/user-manage' },
    { label: 'User Details', url: '/user-manage/userform' },
  ];
  userId: string;
  showCouncil = false;


  constructor(private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private userService: UserService,
    private toastrService: ToastrServiceService,
    private configService: ConfigService, 
    private sharedService: SharedService
    ){
    this.userForm = new FormGroup({
      firstName: new FormControl('', [Validators.required, Validators.pattern("^[a-zA-Z ]+$")]),
      lastName: new FormControl('', [Validators.required, Validators.pattern("^[a-zA-Z]+$")]),
      username: new FormControl('',[Validators.required, Validators.email]),
      phone:  new FormControl('', [
        Validators.required,
        Validators.pattern(`^[0-9]*$`),
        Validators.minLength(10),
        Validators.maxLength(10)
      ]),
      role: new FormControl('', Validators.required),
      status: new FormControl('', Validators.required),
      council: new FormControl(''),
      department: new FormControl(''),
    });
  }

  ngOnInit(): void {
    // this.grievanceTypes = this.configService.dropDownConfig.GRIEVANCE_TYPES;
    // this.grievanceTypes = this.grievanceTypes.filter((item: any) => item.name !== 'Others');
    this.loggedInUserData = this.authService.getUserData();
    this.userForm.patchValue({
      departmentName: null
    })
    //console.log(this.route);
    this.route.queryParams.subscribe((param)=>{
      //console.log(param['id']);
      this.userId = param['id'];
      //console.log(this.userId);
      // this.userDetails = data;
      // if(Object.keys(this.userDetails).length){
      //   this.isEditUser = true;
      //   this.setUserFormData();
      // }
    })
    this.getCouncils();

  }

  getCouncils() {
    this.sharedService.getCouncils()
    .subscribe({
      next: (response) => {
        if(this.userId !== undefined) {
          this.isEditUser = true;
          this.getUserDetails();
        }
        if (response && response.responseData) {
          response.responseData.forEach((council: any) => {
            if (council.status) {
              if (council.ticketCouncilName.toLowerCase().includes('other')) {
                this.otherCouncilsList.push(council);
              } else {
                this.councilsList.push(council)
              }
            }
          })
        }
      },
      error: (error) => {
        this.toastrService.showToastr(error.error.error, 'Error', 'error');
      }
    });
  }

  getUserDetails() {
    this.userService.getUserDetails(this.userId).subscribe({
      next: (res) => {
        this.userDetails = res.responseData;
        this.setUserFormData();
        if(this.userDetails?.attributes?.role[0] === 'NODALOFFICER') {
          this.getDeparmentsList(this.userDetails?.attributes?.councilId, false);
          this.showCouncil = true
        }
        localStorage.setItem('userDetails', JSON.stringify(res.responseData));
      }
    })
  }

  setUserFormData(){
    let firstName = '', lastName = '';
    //console.log(this.userDetails);
    if((this.userDetails.firstName && this.userDetails.firstName !== "") && (this.userDetails.lastName && this.userDetails.lastName !== "")) {
      firstName = this.userDetails.firstName,
      lastName = this.userDetails.lastName
    };
    // this.getDepartmentId();
    this.userForm.setValue({
      firstName: firstName,
      lastName: lastName,
      username: this.userDetails?.username,
      phone:this.userDetails?.attributes.phoneNumber,
      role:this.userDetails?.attributes.role[0],
      status: this.userDetails?.enabled === true? 'Active' : 'Inactive',
      council: this.userDetails?.attributes?.councilId,
      department: this.userDetails?.attributes?.departmentId ? this.userDetails?.attributes.departmentId : null
    })
    this.userForm.get('role')?.disable()
  }

  // getDepartmentId() {
  //   this.grievanceTypes.map((obj:any) => {
  //     if(this.userDetails?.attributes?.departmentName[0]) {
  //     if(this.userDetails?.attributes?.departmentName[0].toLowerCase() == obj.name.toLowerCase()) {
  //       this.userForm.patchValue({
  //         department: obj.id
  //       })
  //     }
  //     }
  //   })
  // }

  get firstName(){
    return this.userForm.get('firstName')
  }
  get lastName(){
    return this.userForm.get('lastName')
  }

  get username(){
    return this.userForm.get('username')
  }

  get phone(){
    return this.userForm.get('phone')
  }

  get role(){
    return this.userForm.get('role')
  }

  get council(){
    return this.userForm.get('council')
  }

  get department(){
    return this.userForm.get('department')
  }

  navigateToHome(){
    this.router.navigate(['user-manage'])
  }

  getUserRole(roleName: string) {
   return getRole(roleName);
  }

  getDeparmentsList(ticketCouncilId: any, resetDepartment = true) {
    this.departmentsList = [];
    if (resetDepartment) {
      this.userForm.get('department')?.reset();
    }
    const conucil: any = this.councilsList.find((council: any) => council.ticketCouncilId === ticketCouncilId);
    if (conucil && conucil.ticketDepartmentDtoList) {
      this.departmentsList = conucil.ticketDepartmentDtoList.filter((department: any) => department.status);
      this.userForm
    }
  }

  onSubmit(){
    //console.log("user details",  this.userForm.value);
    if( this.isEditUser) {
      this.updateUser();
    } else {
      this.addUser();
    }
  }
  
  updateUser() {
    const {firstName, lastName, phone, role, status, username, department, council} = this.userForm.value;
    debugger
    const requestObj = {
      id: this.userDetails.id,
      keycloakId: this.userDetails.keycloakId,
      firstName: firstName,
      lastName: lastName,
      email: username,
      username: username,
      enabled: status === 'Active'? true: false,
      emailVerified: true,
      credentials: [
        {
            "type": "password",
            "value": "Admin@123",
            "temporary": "false"
        }
    ],
    attributes: {
      module: "grievance",
      phoneNumber: phone,
      Role: this.isEditUser ? this.userDetails?.attributes.role[0] : role,
      councilId: council,
      departmentId: department
    }
    }
    this.isProcessing = true;
    this.userService.updateUser(requestObj).subscribe({
      next: (res) => {
        this.userDetails = res.responseData;
        this.toastrService.showToastr("User updated successfully!", 'Success', 'success', '');
        this.isProcessing = false;
        this.navigateToHome();
     },
     error: (err) => {
      // success response
      if(err.status === 200) {
        this.toastrService.showToastr("User updated successfully!", 'Success', 'success', '');
        this.isProcessing = false;
        this.getUserDetails();
        this.navigateToHome();
      }
      else {
        this.isProcessing = false;
        this.toastrService.showToastr(err?.error.error_message, 'Error', 'error', '');
      }
      
       // Handle the error here in case of login failure
     }}
    );
  }

  addUser() {
    const {firstName, lastName, phone, role, status, username, department, council} = this.userForm.value;
    const enabled = status === 'Active'? true : false;
    const requestObj = {
      firstName,
      lastName,
      email: username,
      username: username,
      enabled: enabled,
      emailVerified: false,
      credentials: [
        {
            type: "password",
            value: "Admin@123",
            temporary: "false"
        }
    ],
    attributes: {
      module: 'grievance',
      phoneNumber: phone,
      Role: role,
      councilId: council,
      departmentId: department
  },
    }
    this.isProcessing= true;
    this.userService.createUser(requestObj).subscribe({
      next: (res) => {
        this.userDetails = res.responseData;
        this.toastrService.showToastr("User created successfully!", 'Success', 'success', '');
        this.isProcessing= false;
        this.navigateToHome();
     },
     error: (err) => {
      if(err.status !== 200) {
      this.toastrService.showToastr(err?.error.error_message, 'Error', 'error', '');
      }
      this.isProcessing= false;
       // Handle the error here in case of login failure
     }}
    );
  }

  getRoleChange(event: any) {
    this.userForm.get('council')?.reset();
    this.userForm.get('department')?.reset();
    switch (event.value) {
      case 'NODALOFFICER': {
        this.showCouncil = true;
        this.userForm.get('council')?.addValidators(Validators.required);
        this.userForm.get('department')?.addValidators(Validators.required);
        break;
      }
      case 'GRIEVANCEADMIN': {
        this.showCouncil = false;
        this.userForm.get('council')?.addValidators(Validators.required);
        this.userForm.get('department')?.addValidators(Validators.required);
        if (this.otherCouncilsList) {
          this.userForm.get('council')?.patchValue(this.otherCouncilsList[0].ticketCouncilId);
          this.userForm.get('department')?.patchValue(this.otherCouncilsList[0].ticketDepartmentDtoList[0].ticketDepartmentId);
        }
        break;
      }
      default: {
        this.showCouncil = false;
        this.userForm.get('council')?.clearValidators();
        this.userForm.get('council')?.reset();
        this.userForm.get('council')?.updateValueAndValidity();
        this.userForm.get('department')?.clearValidators();
        this.userForm.get('department')?.reset();
        this.userForm.get('council')?.updateValueAndValidity();
      }
    }
  }

}
