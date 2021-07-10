import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Button, SafeAreaView, Image } from 'react-native';
import {firebaseApp} from '../firebase-config';
var _ = require('lodash')

class MyOrders extends React.Component{ 


  state = { orders: [],}

  initMyOrder() {
    const db = firebaseApp.firestore();
    const storage = firebaseApp.storage();
    
    const userId = firebaseApp.auth().currentUser.uid;
    if(userId == null || userId == undefined){
      return;
    }
    db.collection("order").where("userId", "==", userId).get().then((snapshot) => {
      var orders = []
      var dataPromisies =[]
      snapshot.forEach((doc) => {
        const orderData = doc.data()
  
        orderData.products.forEach((product) => {
          dataPromisies.push(storage.ref(product.image).getDownloadURL().then((url) => {
            orders.push({
              orderId: orderData.orderId,
              orderStatus: orderData.status,
              imagePath: url,
              ...product
            });
          }).catch(() => {
            orders.push({
              orderId: orderData.orderId,
              orderStatus: orderData.status,
              ...product
            });
          }));
        })
      });
      
      Promise.all(dataPromisies).then(() => {
        this.setState({orders: orders})
      })
      
    }).catch((error) => console.log('error',error));
  }

  componentDidMount(){
    this.initMyOrder()
  }

render() {
  const storage = firebaseApp.storage();
  return (
    <SafeAreaView style={{flex: 1, justifyContent: 'flex-start', backgroundColor: '#FFF', padding: '2%',}}>
      <FlatList
      data={this.state.orders}
      numColumns={1}
      extraData={this.state}
      renderItem={({item}) => {
        const quantity = item.quantity == undefined ? 1 : item.quantity
        const price = _.values(item.productprice)[0]
        const weight = _.keys(item.productprice)[0]
        var trackFlag = false
        var trackRef
        return (
          <View style={{ flex: 1, backgroundColor: '#FFF', padding: 15,}} >
            <View style={{ borderColor: '#75C34D', borderWidth: 2, padding: 15,}}>
            <Text style={{ fontWeight: 'bold', marginBottom: 10,}}>Order ID: {item.orderId}</Text>
            <View style={{display: 'flex', flexDirection: 'row'}}>
              <Image
                style={{ width: 100, height: 100, marginBottom: 10,}}
                source={{
                uri: item.imagePath,
                }}
                resizeMode='center'
              />
              <View style={{display: 'flex', flexDirection: 'column'}}>
              <Text style={{ fontWeight: 'bold', marginBottom: 10,}}>{item.productname} [{weight}]</Text>
              <Text style={{ marginBottom: 10,}}>Quantity: {quantity}</Text>
              <Text style={{ marginBottom: 10, }}>$ {price * quantity}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => {
              trackFlag = !trackFlag
              trackRef.setNativeProps({style : trackFlag ? styles.trackContainer : styles.hiddenTrackContainer})
              
              console.log('trackFlag', trackFlag)
              }}>
              <Text style={{ backgroundColor: '#75C34D', color: '#FFF', fontWeight: 'bold', padding: 10,}}>Track package</Text>
            </TouchableOpacity>
            <View ref={ele => trackRef = ele} style={styles.hiddenTrackContainer}>
              <Text style={ item.orderStatus == "Ordered" ? styles.orderd : styles.disabled }>Ordered</Text>
              <Text style={item.orderStatus == "Confirmed" ? styles.orderd : styles.disabled}>Confirmed</Text>
              <Text style={item.orderStatus == "Canceled" ? styles.cancelled : styles.disabled}>Cancelled</Text>
              <Text style={item.orderStatus == "Shipped" ? styles.shipped : styles.disabled}>Shipped</Text>
              <Text style={item.orderStatus == "Delivered" ? styles.delivered : styles.disabled}>Delivered</Text>
            </View>
          </View>
        </View>
        )
    }}/>
    </SafeAreaView>
  );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: '#FFF',
    padding: '2%',
    // flexDirection: 'row',
  },
  orderd:{
    fontWeight: 'bold', color:'#17a2b8',
  },
  cancelled:{
    fontWeight: 'bold', color:'#e74a3b',
  },
  shipped:{
    fontWeight: 'bold', color:'#ffc107',
  },
  delivered:{
    fontWeight: 'bold', color:'#28a745',
  },
  disabled:{
    fontWeight: 'bold', color:'#888888',
  },
  trackContainer:{
    display:'flex',
    marginTop: 10, backgroundColor: '#F7F4F4', padding: 10, borderWidth: 2,
  },
  hiddenTrackContainer:{
    display: 'none'
  }
});

export default MyOrders;