<template>
  <div>
    <small v-if="$route.query?.id">Připojení účastníci: {{connected}}</small>
    <h2>Týmovač</h2>
    <div style="float:right">
      <button @click="copyToClip">Kopírovat do 📋</button>
      <button @click="getFromClip">Načíst z 📋</button>
    </div>
    <form @submit.prevent="newPerson">
      <input
        type="text"
        placeholder="Přidat člověka"
        v-model="newName"
      />
      <input
        type="submit"
        value="+ 😎"
        title="Přidat člověka"
      />
    </form>
    <form
      @submit.prevent="newTeam"
      style="padding-bottom:10px"
    >
      <input
        type="text"
        placeholder="Přidat tým"
        v-model="newTeamName"
      />
      <input
        title="Přidat tým"
        type="submit"
        value="+ 🧑‍🤝‍🧑"
      />
      &ensp;
    </form>
    <div class="teams">
      <div
        v-for="(team, indexT) in teams"
        :key="`t${indexT}`"
        @drop="onDropTeam($event, indexT)"
        @dragover.prevent
        @dragenter.prevent
      >
        <h3>{{team.name}} <button
            v-if="teams.length>1"
            @click="teams.splice(indexT, 1); save()"
          >🗑</button></h3>
        <div
          :class="{
            person:true,
            friends: (person.friends?.length ?? 0) > 0
          }"
          v-for="(person, indexP) in team.people"
          :key="`p${indexT}${indexP}${person.name}`"
          draggable="true"
          @dragstart="startDrag($event, indexT, indexP)"
          @drop="onDropPerson($event, indexT, indexP)"
          @dragover.prevent
          @dragenter.prevent
        >
          <img
            src="/person.svg"
            alt="Osoba"
          />
          <span>{{person.name}}</span>&ensp;
          <button @click="removePerson(indexT, indexP)">🗑</button>
          <br>
          <div v-if="person.friends">
            <div
              class="person"
              v-for="(friend, indexF) in person.friends"
              :key="`f${indexT}${indexP}${indexF}${friend.name}`"
              draggable="true"
              @dragstart="startDrag($event, indexT, indexP, indexF)"
            >
              &gt;
              <img
                src="/person.svg"
                alt="Osoba"
              />
              <span>{{friend.name}}</span>&ensp;
              <button @click="removePerson(indexT, indexP, indexF)">🗑</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <br>
    <textarea
      placeholder="Komentář..."
      v-model="comments"
      @input="sendComments"
      @focus="editing = true"
      @blur="editing = false"
    ></textarea>
    {{error}}
  </div>
</template>

<script>
import '~/style.scss'
import { db } from "~/firebase.js"
import { get, ref, set, onValue, push, onDisconnect } from "firebase/database";
if (process.client) {
  import('drag-drop-touch');
}

export default {
  data() {
    return {
      editing: false,
      connected: 1,
      dragging: false,
      error: '',
      newName: '',
      newTeamName: '',
      teams: [
        {
          name: 'Skupinka 1',
          people: []
        }
      ],
      comments: ""
    }
  },
  async mounted() {
    if (this.$route.query?.id) {
      try {
        this.error = '';
        var snapshot = await get(ref(db, this.$route.query.id))
        if (snapshot.exists()) {
          var resultVal = snapshot.val();
          this.updateDisplayedData(resultVal);
          onValue(ref(db, this.$route.query.id), (snapshot) => {
            const data = snapshot.val();
            if (!this.editing) {
              this.updateDisplayedData(data);
            }
          });

          var connectionsRef = ref(db, "/connections/" + this.$route.query.id);

          var connectedRef = ref(db, ".info/connected/");
          // Number of online users is the number of objects in the presence list.

          // When the client's connection state changes...
          onValue(connectedRef, async (snap) => {

            // If they are connected..
            if (snap.val()) {

              // Add user to the connections list.
              var con = await push(connectionsRef, true);

              // Remove user from the connection list when they disconnect.
              onDisconnect(con).remove();
            }
          });

          onValue(connectionsRef, (snap) => {
            if (snap.val()) {
              this.connected = snap.size;
            }
          })
        }
        else {
          console.log("No data available");
        }
      }
      catch (e) {
        this.error = e;
      }
    }
    else {
      this.load();
    }
  },
  methods: {
    updateDisplayedData(data) {
      this.teams = data.teams;
      this.comments = data.comments;
    },
    async sendComments() {
      if (this.$route.query?.id) {
        try {
          await set(ref(db, this.$route.query.id + '/comments'), this.comments);
        }
        catch (e) {
          this.error = e;
        }
      }
      else {
        localStorage.comments = JSON.stringify(this.comments);
      }
    },
    async sendTeams() {
      if (this.$route.query?.id) {
        try {
          await set(ref(db, this.$route.query.id + '/teams'), this.teams);
        }
        catch (e) {
          this.error = e;
        }
      }
    },
    newPerson() {
      this.teams[0].people.push(
        {
          name: this.newName,
          friends: []
        }
      );
      this.newName = '';//reset

      this.save();
    },
    newTeam() {
      this.teams.push(
        {
          name: this.newTeamName,
          people: []
        }
      );
      this.newTeamName = '';//reset

      this.save();
    },
    save() {
      if (this.$route.query?.id) {
        this.sendTeams();
      }
      else {
        localStorage.teams = JSON.stringify(this.teams);
        localStorage.comments = JSON.stringify(this.comments);
      }
    },
    load() {
      if (localStorage.teams) {
        var parsed;
        try {
          parsed = JSON.parse(localStorage.teams);
          this.error = '';
        }
        catch (e) {
          this.error = e;
        }
        this.teams = parsed || this.teams;

        try {
          parsed = JSON.parse(localStorage.comments);
          this.error = '';
        }
        catch (e) {
          this.error = e;
        }
        this.comments = parsed || this.comments;
      }
    },
    removePerson(indexT, indexP, indexF) {
      if (indexF) {
        this.teams[indexT].people[indexP].friends.splice(indexF, 1);
      }
      else {
        this.teams[indexT].people.splice(indexP, 1);
      }
      this.save();
    },
    startDrag(evt, indexT, indexP, indexF) {
      if (!this.dragging) {
        this.dragging = true;
        evt.dataTransfer.dropEffect = 'move'
        evt.dataTransfer.effectAllowed = 'move'
        evt.dataTransfer.setData('indexes', JSON.stringify(
          {
            draggedT: indexT,
            draggedP: indexP,
            draggedF: indexF
          }
        ));
      }
      else {

      }
    },
    onDropPerson(evt, indexT, indexP) {
      this.dragging = false;
      const { draggedT, draggedP, draggedF } = JSON.parse(
        evt.dataTransfer.getData('indexes')
      );

      var draggedPerson = this.teams[draggedT]?.people[draggedP];
      if (!this.teams[indexT].people) {
        this.teams[indexT].people = [];
      }
      if (typeof draggedF != 'undefined') {
        if (!this.teams[indexT].people[indexP].friends) {
          this.teams[indexT].people[indexP].friends = [];
        }
        this.teams[indexT].people[indexP].friends.push(
          draggedPerson.friends[draggedF]
        );
        draggedPerson.friends.splice(draggedF, 1);
      }
      else {
        if (indexT == draggedT && indexP == draggedP) {
          return;//Dragged to same person
        }

        // Flatten friends array
        var friendsToAdd = [];
        if (draggedPerson.friends?.length > 0) {
          friendsToAdd = draggedPerson.friends;
        }
        if (!this.teams[indexT].people[indexP].friends) {
          this.teams[indexT].people[indexP].friends = [];
        }
        this.teams[indexT].people[indexP].friends.push(
          {
            name: draggedPerson.name,
            friends: []
          }
        );
        for (var previousFriend of friendsToAdd) {
          this.teams[indexT].people[indexP].friends.push(
            previousFriend);
        }
        this.teams[draggedT].people.splice(draggedP, 1);
      }

      this.save();
    },
    onDropTeam(evt, indexT) {
      this.dragging = false;
      const { draggedT, draggedP, draggedF } = JSON.parse(
        evt.dataTransfer.getData('indexes')
      );

      var draggedPerson = (this.teams[draggedT]?.people ?? [])[draggedP];
      if (!this.teams[indexT].people) {
        this.teams[indexT].people = [];
      }
      if (typeof draggedPerson != 'undefined') {
        //If the dragged item still exists
        if (draggedT == indexT)
          return;//Dragged to same team

        if (typeof draggedF != 'undefined') {
          if (!draggedPerson.friends) {
            draggedPerson.friends = [];
          }
          var draggedFriend = draggedPerson.friends[draggedF];
          if (typeof draggedFriend != 'undefined') {
            this.teams[indexT].people.push(
              draggedFriend
            );
            this.teams[draggedT].people[draggedP].friends.splice(draggedF, 1);
          }
          this.save();
        }
        else {
          this.teams[indexT].people.push(
            this.teams[draggedT].people[draggedP]
          );
          this.teams[draggedT].people.splice(draggedP, 1);
          this.save();
        }
      }
    },
    async getFromClip() {
      const text = await navigator.clipboard.readText();
      try {
        this.teams = JSON.parse(text);
        this.error = '';
        this.sendTeams();
      }
      catch (e) {
        this.error = e;
      }
    },
    copyToClip() {
      var text = JSON.stringify(this.teams);

      function fallbackCopyTextToClipboard(text) {
        var textArea = document.createElement("textarea");
        textArea.value = text;

        // Avoid scrolling to bottom
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          var successful = document.execCommand('copy');
          var msg = successful ? 'successful' : 'unsuccessful';
          console.log('Fallback: Copying text command was ' + msg);
        } catch (err) {
          this.error = 'Ajaj, nepodařilo se zkopírovat';
        }

        document.body.removeChild(textArea);
      }
      if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
      }
      navigator.clipboard.writeText(text).then(function () {
        console.log('Async: Copying to clipboard was successful!');
      }, function (err) {
        this.error = 'Ajaj, nepodařilo se zkopírovat, jak mělo';
      });
    }
  }
}
</script>
