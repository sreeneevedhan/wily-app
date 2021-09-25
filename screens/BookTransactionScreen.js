import React from 'react';
import { StyleSheet, Text, View,TouchableOpacity, TextInput, KeyboardAvoidingView, ToastAndroid } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Permissions from 'expo-permissions';
import firebase from 'firebase'
import db from '../config.js'


export default class BookTrasactionScreen extends React.Component{
    constructor(){
        super();
        this.state={
            hasCameraPermissions:null,
            scanned:false,
            scannedData:'',
            buttonState:'normal',
            scannedBookId:'',
            scannedStudentId:'',
            TransactionMessage:''
        }
    }

    getCameraPermissions=async(id)=>{
        const {status}=await Permissions.askAsync(Permissions.CAMERA)
        this.setState({
            hasCameraPermissions:status==="granted",
            buttonState:id,
            scanned:false,
            
        })
    }

    handleBarCodeScanned=async({type,data})=>{
        const {buttonState}=this.state

        if(buttonState==="BookId"){
        this.setState({
            scanned:true,
            scannedData:data,
            buttoonState:'normal'
               
        })
        }else if(buttonState==="StudentId"){
            this.setState({
                scanned:true,
                scannedData:data,
                buttoonState:'normal'
                   
            })
        }
    }

    initaiteBookIssue=async()=>{
        db.collection("transactions").add({
            'studentId':this.state.scannedStudentId,
            'bookId':this.state.scannedBookId,
            'date':firebase.firestore.Timestamp.now().toDate(),
            'transactionType':"Issue"
        })

        db.collection("books").doc(this.state.scannedBookId).update({
            'bookAvailability':false
        })

        db.collection("students").doc(this.state.scannedStudentId).update({
            'numberOfBooksIssued':firebase.firestore.FieldValue.increment(1)
        })
        
    }

    initaiteBookReturn=async()=>{
        db.collection("transactions").add({
            'studentId':this.state.scannedStudentId,
            'bookId':this.state.scannedBookId,
            'date':firebase.firestore.Timestamp.now().toDate(),
            'transactionType':"Returned"
        })

        db.collection("books").doc(this.state.scannedBookId).update({
            'bookAvailability':true
        })

        db.collection("students").doc(this.state.scannedStudentId).update({
            'numberOfBooksIssued':firebase.firestore.FieldValue.increment(-1)
        })

    }

    checkStudentEligibilityForBookIssue=async()=>{
        const studentRef=await db.collection("students").where("studentId","==",this.state.scannedStudentId).get()
        var isStudentEligible=""
        if(studentRef.docs.length===0){
            this.setState({
                scannedBookId:'',
                scannedStudentId:''
            })
            isStudentEligible=false
            alert("the student id dosen't exist in the database")
        }else{
            studentRef.docs.map((doc)=>{
                var student=doc.data()
                if(student.numberOfBooksIssued<2){
                    isStudentEligible=true
                }else{
                    isStudentEligible=false
                    alert("the student has issued two books")
                    this.setState({
                        scannedStudentId:'',
                        scannedBookId:''
                    })
                }
            })
        }
        return isStudentEligible
    }

    checkStudentEligibilityForBookReturn=async()=>{
        const transactionRef=await db.collection("transactions").where("bookId","==",this.state.scannedBookId).limit(1).get()
        var isStudentEligible=""
        transactionRef.docs.map((doc)=>{
            var lastBookTransaction=doc.data()
            if(lastBookTransaction.studentId===this.state.scannedStudentId){
                isStudentEligible=true
            }else{
                isStudentEligible=false
                alert("the wasn't issued by this student")
                this.setState({
                    scannedStudentId:'',
                    scannedBookId:''
                })
            }
        })
        console.log(isStudentEligible)
        return isStudentEligible
    }

    checkBookEligibility=async()=>{
        const bookRef=await db.collection("books").where("bookId","==",this.state.scannedBookId).get()
        var transactionType=""

        if(bookRef.docs.length==0){
            transactionType=false
        }else {
            bookRef.docs.map((doc)=>{
                var book=doc.data()
                if(book.bookAvailability){
                    transactionType="Issue"
                }else{
                    transactionType="Returned"
                }
            })

        }
        console.log(transactionType)
        return transactionType
    }

    handleTransaction=async()=>{
        
        //verify if the student is eligible for book issue or return or none
        //if is the student id exits in the database
        //issue: number issued is less than two
        //issue: verify book availabilty
        //return: last transaction = last book issued by the student id
        var transactionType=await this.checkBookEligibility();
        if(!transactionType){
            alert("the book dosen't exist in library database")
            this.setState({
                scannedBookId:'',
                scannedStudentId:''
            })
        }else if (transactionType==='Issue'){
            var isStudentEligible=await this.checkStudentEligibilityForBookIssue()
            if(isStudentEligible){
                this.initaiteBookIssue()
                alert('book issued to the student')
            }
        }else{
            var isStudentEligible=await this.checkStudentEligibilityForBookReturn()
            if(isStudentEligible){
                this.initaiteBookReturn()
                alert('book returned to the library')
            }       
        }
        
    }

    render(){
        const hasCameraPermissions=this.state.hasCameraPermissions;
        const scanned=this.state.scanned;
        const buttonState=this.state.buttonState;
//        console.log(scanned)

        if(buttonState!=="normal"&&hasCameraPermissions){
            //console.log()
            return(
                <BarCodeScanner
                onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
                style={StyleSheet.absoluteFillObject}
                />
                
            );
            
        }else if(buttonState==="normal"){

        return(
            <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>

                <View style={styles.inputView}>
                    <TextInput
                        style={styles.inputBox}
                        placeholder="Book ID"
                        value={this.state.scannedBookId}
                        onChangeText={(text)=>{
                            this.setState({
                                scannedBookId:text
                            })
                        }}
                    />
                    <TouchableOpacity style={styles.scanButton}
                    onPress={()=>{this.getCameraPermissions("BookId")}}
                    >
                        <Text style={styles.buttonText}>Scan</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputView}>
                    <TextInput
                    style={styles.inputBox}
                    placeholder="student ID"
                    value={this.state.scannedStudentId}
                    onChangeText={(text)=>{
                        this.setState({
                            scannedStudentId:text
                        })
                    }}
                    />
                    <TouchableOpacity style={styles.scanButton}
                    onPress={()=>{this.getCameraPermissions("StudentId")}}
                    >
                        <Text style={styles.buttonText}>Scan</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.submitButton}
                onPress={()=>{
                    this.handleTransaction()
                    this.setState({
                        scannedBookId:'',
                        scannedStudentId:''
                    })
                }}
                >
                    <Text style={styles.submitButtonText}>submit</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        )

                }
    }
}

const styles=StyleSheet.create({
    container:{
        flex:1,
        justifyContent:'center',
        alignItems:'center'
    },
    displayText:{
        fontSize:15,
        textDecorationLine:'underline'
    },
    scanButton:{
        backgroundColor:'blue',
        padding:10,
        margin:10
    },
    buttonText:{
        fontSize:15,
        textAlign:'center',
        marginTop:10
    },
    inputView:{
        flexDirection:'row',
        margin:20,
    },
    inputBox:{
        width:200,
        height:40,
        borderWidth:1.5,
        borderRightWidth:0,
        fontSize:20
    },
    scanButton:{
        backgroundColor:'blue',
        width:50,
        borderWidth:1.5,
        borderLeftWidth:0
    },
    submitButton:{
        backgroundColor:'cyan',
        width:100,
        height:50
    },
    submitButtonText:{
        padding:10,
        textAlign:'center',
        fontSize:20,
        fontWeight:'bold',
        color:'white'
    }

})
